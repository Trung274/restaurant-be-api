const MenuItem = require('../models/MenuItem.model');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all menu items (Public)
// @route   GET /api/v1/menu-items
// @access  Public
exports.getAllMenuItems = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by category
    if (req.query.category) {
        query.category = req.query.category;
    }

    // Filter by status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Filter by popular
    if (req.query.popular !== undefined) {
        query.popular = req.query.popular === 'true';
    }

    // Filter by vegetarian
    if (req.query.vegetarian !== undefined) {
        query.vegetarian = req.query.vegetarian === 'true';
    }

    // Filter by spicy
    if (req.query.spicy !== undefined) {
        query.spicy = req.query.spicy === 'true';
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) {
            query.price.$gte = parseInt(req.query.minPrice, 10);
        }
        if (req.query.maxPrice) {
            query.price.$lte = parseInt(req.query.maxPrice, 10);
        }
    }

    // Search by name or description
    if (req.query.search) {
        query.$text = { $search: req.query.search };
    }

    // Build sort
    let sort = '-createdAt'; // Default sort
    if (req.query.sort) {
        sort = req.query.sort.split(',').join(' ');
    }

    const total = await MenuItem.countDocuments(query);
    const menuItems = await MenuItem.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: menuItems.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        data: menuItems
    });
});

// @desc    Get single menu item (Public)
// @route   GET /api/v1/menu-items/:id
// @access  Public
exports.getMenuItemById = asyncHandler(async (req, res, next) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: menuItem
    });
});

// @desc    Create menu item
// @route   POST /api/v1/menu-items
// @access  Private/Admin/Manager
exports.createMenuItem = asyncHandler(async (req, res, next) => {
    // Add user who created this item
    req.body.createdBy = req.user.id;
    req.body.updatedBy = req.user.id;

    const menuItem = await MenuItem.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: menuItem
    });
});

// @desc    Update menu item
// @route   PUT /api/v1/menu-items/:id
// @access  Private/Admin/Manager
exports.updateMenuItem = asyncHandler(async (req, res, next) => {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
    }

    // Track who updated this item
    req.body.updatedBy = req.user.id;

    menuItem = await MenuItem.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'Menu item updated successfully',
        data: menuItem
    });
});

// @desc    Delete menu item
// @route   DELETE /api/v1/menu-items/:id
// @access  Private/Admin/Manager
exports.deleteMenuItem = asyncHandler(async (req, res, next) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
    }

    await menuItem.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully',
        data: {}
    });
});

// @desc    Get menu statistics (Public)
// @route   GET /api/v1/menu-items/stats
// @access  Public
exports.getMenuStats = asyncHandler(async (req, res, next) => {
    const stats = await MenuItem.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                avgRating: { $avg: '$rating' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    const totalItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ status: 'available' });
    const popularItems = await MenuItem.countDocuments({ popular: true });

    res.status(200).json({
        success: true,
        data: {
            byCategory: stats,
            summary: {
                totalItems,
                availableItems,
                popularItems,
                outOfStock: totalItems - availableItems
            }
        }
    });
});
