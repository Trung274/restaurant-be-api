const Table = require('../models/Table.model');
const Order = require('../models/Order.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all tables
// @route   GET /api/v1/tables
// @access  Public
exports.getAllTables = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by floor
    if (req.query.floor) {
        query.floor = req.query.floor;
    }

    // Filter by section
    if (req.query.section) {
        query.section = req.query.section;
    }

    // Filter by status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Filter by capacity
    if (req.query.minCapacity || req.query.maxCapacity) {
        query.capacity = {};
        if (req.query.minCapacity) {
            query.capacity.$gte = parseInt(req.query.minCapacity, 10);
        }
        if (req.query.maxCapacity) {
            query.capacity.$lte = parseInt(req.query.maxCapacity, 10);
        }
    }

    // Build sort
    let sort = 'number'; // Default sort by table number
    if (req.query.sort) {
        sort = req.query.sort.split(',').join(' ');
    }

    const total = await Table.countDocuments(query);
    const tables = await Table.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limit)
        .populate('activeSession.orderId', 'items totalAmount');

    res.status(200).json({
        success: true,
        count: tables.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        data: tables
    });
});

// @desc    Get single table by ID
// @route   GET /api/v1/tables/:id
// @access  Public
exports.getTableById = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id)
        .populate('activeSession.orderId')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: table
    });
});

// @desc    Create new table
// @route   POST /api/v1/tables
// @access  Private/Admin/Manager
exports.createTable = asyncHandler(async (req, res, next) => {
    // Add user who created this table
    req.body.createdBy = req.user.id;
    req.body.updatedBy = req.user.id;

    const table = await Table.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: table
    });
});

// @desc    Update table configuration
// @route   PUT /api/v1/tables/:id
// @access  Private/Admin/Manager
exports.updateTable = asyncHandler(async (req, res, next) => {
    let table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Prevent updating activeSession through this endpoint
    delete req.body.activeSession;
    delete req.body.status;

    // Track who updated this table
    req.body.updatedBy = req.user.id;

    table = await Table.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'Table updated successfully',
        data: table
    });
});

// @desc    Delete table
// @route   DELETE /api/v1/tables/:id
// @access  Private/Admin/Manager
exports.deleteTable = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Check if table is currently occupied
    if (table.status === 'occupied') {
        return next(new ErrorResponse('Cannot delete an occupied table', 400));
    }

    await table.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Table deleted successfully',
        data: {}
    });
});

// @desc    Check-in table (Open table)
// @route   POST /api/v1/tables/:id/check-in
// @access  Private/Operations/Manager/Admin
exports.checkInTable = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Check if table is available or reserved
    if (table.status !== 'available' && table.status !== 'reserved') {
        return next(new ErrorResponse(`Cannot check-in: table is currently ${table.status}`, 400));
    }

    const { guests } = req.body;

    if (!guests || guests < 1) {
        return next(new ErrorResponse('Please provide number of guests', 400));
    }

    // Create new order
    const order = await Order.create({
        tableId: table._id,
        tableNumber: table.number,
        numberOfGuests: guests,
        createdBy: req.user.id,
        servedBy: req.user.id
    });

    // Update table status
    table.status = 'occupied';
    table.activeSession = {
        currentGuests: guests,
        orderId: order._id,
        checkInTime: new Date()
    };
    table.updatedBy = req.user.id;
    await table.save();

    res.status(200).json({
        success: true,
        message: 'Table checked in successfully',
        data: {
            table,
            order
        }
    });
});

// @desc    Reserve table
// @route   POST /api/v1/tables/:id/reserve
// @access  Private/Operations/Manager/Admin
exports.reserveTable = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Check if table is available
    if (table.status !== 'available') {
        return next(new ErrorResponse(`Table is currently ${table.status}`, 400));
    }

    const { reservationTime, customerName, customerPhone, guests } = req.body;

    if (!reservationTime || !customerName || !customerPhone) {
        return next(new ErrorResponse('Please provide reservation time, customer name, and phone number', 400));
    }

    // Update table status
    table.status = 'reserved';
    table.activeSession = {
        reservationTime: new Date(reservationTime),
        customerName,
        customerPhone,
        currentGuests: guests || table.capacity
    };
    table.updatedBy = req.user.id;
    await table.save();

    res.status(200).json({
        success: true,
        message: 'Table reserved successfully',
        data: table
    });
});

// @desc    Checkout table (Payment)
// @route   POST /api/v1/tables/:id/checkout
// @access  Private/Operations/Manager/Admin
exports.checkoutTable = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Check if table is occupied
    if (table.status !== 'occupied') {
        return next(new ErrorResponse('Table is not currently occupied', 400));
    }

    if (!table.activeSession?.orderId) {
        return next(new ErrorResponse('No active order found for this table', 400));
    }

    // Update order status
    const order = await Order.findById(table.activeSession.orderId);
    if (order) {
        order.status = 'completed';
        order.checkOutTime = new Date();
        order.paymentMethod = req.body.paymentMethod || 'cash';
        order.paymentStatus = 'paid';

        // Update payment details if provided
        if (req.body.tax !== undefined) order.tax = req.body.tax;
        if (req.body.serviceCharge !== undefined) order.serviceCharge = req.body.serviceCharge;
        if (req.body.discount !== undefined) order.discount = req.body.discount;

        order.calculateTotal();
        await order.save();
    }

    // Update table status to cleaning
    table.status = 'cleaning';
    table.updatedBy = req.user.id;
    await table.save();

    res.status(200).json({
        success: true,
        message: 'Table checked out successfully',
        data: {
            table,
            order
        }
    });
});

// @desc    Clean table (Mark as available)
// @route   POST /api/v1/tables/:id/clean
// @access  Private/Operations/Manager/Admin
exports.cleanTable = asyncHandler(async (req, res, next) => {
    const table = await Table.findById(req.params.id);

    if (!table) {
        return next(new ErrorResponse(`Table not found with id of ${req.params.id}`, 404));
    }

    // Check if table is in cleaning status
    if (table.status !== 'cleaning' && table.status !== 'reserved') {
        return next(new ErrorResponse(`Table must be in cleaning or reserved status. Current status: ${table.status}`, 400));
    }

    // Clear active session and set to available
    table.status = 'available';
    table.clearSession();
    table.updatedBy = req.user.id;
    await table.save();

    res.status(200).json({
        success: true,
        message: 'Table cleaned and now available',
        data: table
    });
});

// @desc    Get table statistics
// @route   GET /api/v1/tables/stats
// @access  Public
exports.getTableStats = asyncHandler(async (req, res, next) => {
    const totalTables = await Table.countDocuments();
    const availableTables = await Table.countDocuments({ status: 'available' });
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const reservedTables = await Table.countDocuments({ status: 'reserved' });
    const cleaningTables = await Table.countDocuments({ status: 'cleaning' });

    // Stats by floor
    const byFloor = await Table.aggregate([
        {
            $group: {
                _id: '$floor',
                total: { $sum: 1 },
                available: {
                    $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                },
                occupied: {
                    $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
                },
                reserved: {
                    $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
                },
                avgCapacity: { $avg: '$capacity' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Stats by section
    const bySection = await Table.aggregate([
        {
            $group: {
                _id: '$section',
                total: { $sum: 1 },
                available: {
                    $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                },
                occupied: {
                    $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { total: -1 }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalTables,
                availableTables,
                occupiedTables,
                reservedTables,
                cleaningTables,
                occupancyRate: totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(2) + '%' : '0%'
            },
            byFloor,
            bySection
        }
    });
});
