const Customer = require('../models/Customer.model');
const Order = require('../models/Order.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private/Manager/Admin/Operations
exports.getAllCustomers = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Filter by membership tier
    if (req.query.tier) {
        query.membershipTier = req.query.tier;
    }

    // Filter by favorite
    if (req.query.isFavorite !== undefined) {
        query.isFavorite = req.query.isFavorite === 'true';
    }

    // Search by name or phone
    if (req.query.search) {
        query.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { phone: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    // Build sort
    let sort = '-totalSpent'; // Default: highest spenders first
    if (req.query.sort) {
        sort = req.query.sort.split(',').join(' ');
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: customers.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        data: customers
    });
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private/Manager/Admin/Operations
exports.getCustomerById = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer || !customer.isActive) {
        return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }

    // Get customer's order history
    const orders = await Order.find({ customerId: customer._id })
        .sort('-createdAt')
        .limit(10)
        .select('tableNumber totalAmount status paymentStatus createdAt');

    res.status(200).json({
        success: true,
        data: {
            customer,
            recentOrders: orders
        }
    });
});

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private/Manager/Admin/Operations
exports.createCustomer = asyncHandler(async (req, res, next) => {
    const { name, phone, email, avatar, membershipTier, notes } = req.body;

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ phone, isActive: true });
    if (existingCustomer) {
        return next(new ErrorResponse('Customer with this phone number already exists', 400));
    }

    const customer = await Customer.create({
        name,
        phone,
        email,
        avatar,
        membershipTier: membershipTier || 'bronze',
        notes
    });

    res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
    });
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private/Manager/Admin
exports.updateCustomer = asyncHandler(async (req, res, next) => {
    let customer = await Customer.findById(req.params.id);

    if (!customer || !customer.isActive) {
        return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }

    // Fields that can be updated
    const fieldsToUpdate = {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        avatar: req.body.avatar,
        membershipTier: req.body.membershipTier,
        points: req.body.points,
        isFavorite: req.body.isFavorite,
        notes: req.body.notes
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
        fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    customer = await Customer.findByIdAndUpdate(
        req.params.id,
        fieldsToUpdate,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
    });
});

// @desc    Delete customer (soft delete)
// @route   DELETE /api/v1/customers/:id
// @access  Private/Manager/Admin
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
    }

    // Soft delete
    customer.isActive = false;
    await customer.save();

    res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
        data: {}
    });
});

// @desc    Get customer statistics
// @route   GET /api/v1/customers/stats
// @access  Private/Manager/Admin
exports.getCustomerStats = asyncHandler(async (req, res, next) => {
    const stats = await Customer.aggregate([
        {
            $match: { isActive: true }
        },
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalCustomers: { $sum: 1 },
                            totalRevenue: { $sum: '$totalSpent' },
                            avgSpending: { $avg: '$totalSpent' }
                        }
                    }
                ],
                byTier: [
                    {
                        $group: {
                            _id: '$membershipTier',
                            count: { $sum: 1 },
                            totalRevenue: { $sum: '$totalSpent' }
                        }
                    },
                    {
                        $sort: { totalRevenue: -1 }
                    }
                ],
                topCustomers: [
                    {
                        $sort: { totalSpent: -1 }
                    },
                    {
                        $limit: 10
                    },
                    {
                        $project: {
                            name: 1,
                            phone: 1,
                            membershipTier: 1,
                            totalSpent: 1,
                            totalOrders: 1
                        }
                    }
                ]
            }
        }
    ]);

    const result = stats[0];

    res.status(200).json({
        success: true,
        data: {
            overall: result.overall[0] || { totalCustomers: 0, totalRevenue: 0, avgSpending: 0 },
            byTier: result.byTier,
            topCustomers: result.topCustomers
        }
    });
});
