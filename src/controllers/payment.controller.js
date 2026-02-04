const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const Customer = require('../models/Customer.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create payment (Process payment for an order)
// @route   POST /api/v1/payments
// @access  Private/Operations/Manager/Admin
exports.createPayment = asyncHandler(async (req, res, next) => {
    const { orderId, paymentMethod, notes } = req.body;

    // Validate order exists
    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Check if order is completed
    if (order.status !== 'completed') {
        return next(new ErrorResponse('Order must be completed before payment', 400));
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
        return next(new ErrorResponse('Order has already been paid', 400));
    }

    // Create payment record
    const payment = await Payment.create({
        orderId: order._id,
        tableNumber: order.tableNumber,
        amount: order.totalAmount,
        paymentMethod: paymentMethod || 'cash',
        processedBy: req.user._id,
        notes
    });

    // Update order payment status
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod || 'cash';
    await order.save();

    // Update customer stats if order has customerId
    if (order.customerId) {
        const customer = await Customer.findById(order.customerId);
        if (customer) {
            await customer.updateStats(order.totalAmount);
        }
    }

    // Populate payment details
    await payment.populate('processedBy', 'name email');
    await payment.populate('orderId', 'tableNumber totalAmount items');

    res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: payment
    });
});

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private/Accountant/Manager/Admin
exports.getAllPayments = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Filter by payment method
    if (req.query.paymentMethod) {
        query.paymentMethod = req.query.paymentMethod;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
        query.paidAt = {};
        if (req.query.startDate) {
            query.paidAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            query.paidAt.$lte = new Date(req.query.endDate);
        }
    }

    // Filter by table number
    if (req.query.tableNumber) {
        query.tableNumber = req.query.tableNumber;
    }

    // Build sort
    let sort = '-paidAt'; // Default: newest first
    if (req.query.sort) {
        sort = req.query.sort.split(',').join(' ');
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limit)
        .populate('processedBy', 'name email')
        .populate('orderId', 'tableNumber numberOfGuests items');

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        data: payments
    });
});

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private/Accountant/Manager/Admin
exports.getPaymentById = asyncHandler(async (req, res, next) => {
    const payment = await Payment.findById(req.params.id)
        .populate('processedBy', 'name email')
        .populate('orderId');

    if (!payment) {
        return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: payment
    });
});

// @desc    Get payment statistics
// @route   GET /api/v1/payments/stats
// @access  Private/Accountant/Manager/Admin
exports.getPaymentStats = asyncHandler(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Get date range for daily stats (last 7 days)
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 6);

    // Aggregate payment statistics
    const stats = await Payment.aggregate([
        {
            $facet: {
                // Overall stats
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalPayments: { $sum: 1 },
                            totalRevenue: { $sum: '$amount' },
                            avgPayment: { $avg: '$amount' }
                        }
                    }
                ],
                // Today stats
                today: [
                    {
                        $match: {
                            paidAt: { $gte: today }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPayments: { $sum: 1 },
                            totalRevenue: { $sum: '$amount' }
                        }
                    }
                ],
                // This month stats
                thisMonth: [
                    {
                        $match: {
                            paidAt: { $gte: thisMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPayments: { $sum: 1 },
                            totalRevenue: { $sum: '$amount' }
                        }
                    }
                ],
                // By payment method
                byPaymentMethod: [
                    {
                        $group: {
                            _id: '$paymentMethod',
                            count: { $sum: 1 },
                            totalAmount: { $sum: '$amount' }
                        }
                    },
                    {
                        $sort: { totalAmount: -1 }
                    }
                ],
                // Daily revenue (last 7 days)
                dailyRevenue: [
                    {
                        $match: {
                            paidAt: { $gte: last7Days }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$paidAt' }
                            },
                            revenue: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    },
                    {
                        $project: {
                            _id: 0,
                            date: '$_id',
                            revenue: 1,
                            count: 1
                        }
                    }
                ]
            }
        }
    ]);

    // Get best-selling items from completed orders
    const bestSellingItems = await Order.aggregate([
        {
            $match: {
                status: 'completed',
                paymentStatus: 'paid'
            }
        },
        {
            $unwind: '$items'
        },
        {
            $group: {
                _id: '$items.menuItemId',
                name: { $first: '$items.name' },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.subtotal' }
            }
        },
        {
            $sort: { totalQuantity: -1 }
        },
        {
            $limit: 10
        },
        {
            $project: {
                _id: 0,
                menuItemId: '$_id',
                name: 1,
                totalQuantity: 1,
                totalRevenue: 1
            }
        }
    ]);

    const result = stats[0];

    res.status(200).json({
        success: true,
        data: {
            overall: result.overall[0] || { totalPayments: 0, totalRevenue: 0, avgPayment: 0 },
            today: result.today[0] || { totalPayments: 0, totalRevenue: 0 },
            thisMonth: result.thisMonth[0] || { totalPayments: 0, totalRevenue: 0 },
            byPaymentMethod: result.byPaymentMethod,
            dailyRevenue: result.dailyRevenue,
            bestSellingItems: bestSellingItems
        }
    });
});
