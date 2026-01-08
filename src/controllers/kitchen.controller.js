const Order = require('../models/Order.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get kitchen queue (all orders with items to prepare)
 * @route   GET /api/v1/kitchen/queue
 * @access  Private (chef, kitchen-staff, manager, admin)
 */
exports.getKitchenQueue = async (req, res, next) => {
    try {
        const { kitchenStatus, priority, sort = 'checkInTime' } = req.query;

        // Build aggregation pipeline
        const pipeline = [
            // Only get orders that are not completed or cancelled
            { $match: { status: { $nin: ['completed', 'cancelled'] } } },

            // Unwind items to filter at item level
            { $unwind: '$items' },

            // Filter items based on query params
            {
                $match: {
                    ...(kitchenStatus && { 'items.kitchenStatus': kitchenStatus }),
                    ...(priority && { 'items.priority': priority })
                }
            },

            // Sort items
            { $sort: { 'items.priority': -1, checkInTime: 1 } },

            // Group back by order
            {
                $group: {
                    _id: '$_id',
                    tableNumber: { $first: '$tableNumber' },
                    tableId: { $first: '$tableId' },
                    status: { $first: '$status' },
                    checkInTime: { $first: '$checkInTime' },
                    numberOfGuests: { $first: '$numberOfGuests' },
                    items: { $push: '$items' },
                    createdAt: { $first: '$createdAt' }
                }
            },

            // Sort orders
            { $sort: sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 } }
        ];

        const orders = await Order.aggregate(pipeline);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Start preparing an item
 * @route   PATCH /api/v1/kitchen/items/:itemId/start
 * @access  Private (chef, kitchen-staff, manager, admin)
 */
exports.startPreparingItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { orderId } = req.body;

        if (!orderId) {
            return next(new AppError('Please provide orderId', 400));
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Update item status
        order.updateItemKitchenStatus(itemId, 'preparing', req.user._id);

        await order.save();

        // Get the updated item
        const updatedItem = order.items.id(itemId);

        res.status(200).json({
            success: true,
            message: `Started preparing ${updatedItem.name}`,
            data: {
                item: updatedItem,
                order: {
                    _id: order._id,
                    status: order.status,
                    kitchenProgress: order.kitchenProgress
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark item as ready
 * @route   PATCH /api/v1/kitchen/items/:itemId/ready
 * @access  Private (chef, kitchen-staff, manager, admin)
 */
exports.markItemReady = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { orderId } = req.body;

        if (!orderId) {
            return next(new AppError('Please provide orderId', 400));
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Update item status
        order.updateItemKitchenStatus(itemId, 'ready', req.user._id);

        await order.save();

        // Get the updated item
        const updatedItem = order.items.id(itemId);

        res.status(200).json({
            success: true,
            message: `${updatedItem.name} is ready`,
            data: {
                item: updatedItem,
                order: {
                    _id: order._id,
                    status: order.status,
                    kitchenProgress: order.kitchenProgress
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update item priority
 * @route   PATCH /api/v1/kitchen/items/:itemId/priority
 * @access  Private (manager, admin)
 */
exports.updateItemPriority = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { orderId, priority } = req.body;

        if (!orderId || !priority) {
            return next(new AppError('Please provide orderId and priority', 400));
        }

        if (!['normal', 'high', 'urgent'].includes(priority)) {
            return next(new AppError('Priority must be: normal, high, or urgent', 400));
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        const item = order.items.id(itemId);

        if (!item) {
            return next(new AppError('Item not found', 404));
        }

        item.priority = priority;
        await order.save();

        res.status(200).json({
            success: true,
            message: `Priority updated to ${priority}`,
            data: {
                item
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get kitchen statistics
 * @route   GET /api/v1/kitchen/stats
 * @access  Private (manager, admin)
 */
exports.getKitchenStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Aggregate stats
        const stats = await Order.aggregate([
            {
                $match: {
                    status: { $nin: ['cancelled'] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    queued: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'queued'] }, 1, 0] }
                    },
                    preparing: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'preparing'] }, 1, 0] }
                    },
                    ready: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'ready'] }, 1, 0] }
                    },
                    served: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'served'] }, 1, 0] }
                    },
                    avgPrepTime: {
                        $avg: { $cond: [{ $gt: ['$items.actualTime', 0] }, '$items.actualTime', null] }
                    }
                }
            }
        ]);

        // Stats by station
        const stationStats = await Order.aggregate([
            {
                $match: {
                    status: { $nin: ['completed', 'cancelled'] }
                }
            },
            { $unwind: '$items' },
            {
                $match: {
                    'items.station': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$items.station',
                    queued: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'queued'] }, 1, 0] }
                    },
                    preparing: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'preparing'] }, 1, 0] }
                    },
                    ready: {
                        $sum: { $cond: [{ $eq: ['$items.kitchenStatus', 'ready'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Completed today
        const completedToday = await Order.countDocuments({
            status: 'completed',
            checkOutTime: { $gte: today }
        });

        const result = stats[0] || {
            totalItems: 0,
            queued: 0,
            preparing: 0,
            ready: 0,
            served: 0,
            avgPrepTime: 0
        };

        // Format station stats
        const itemsByStation = {};
        stationStats.forEach(stat => {
            itemsByStation[stat._id] = {
                queued: stat.queued,
                preparing: stat.preparing,
                ready: stat.ready
            };
        });

        res.status(200).json({
            success: true,
            data: {
                itemsByStatus: {
                    queued: result.queued,
                    preparing: result.preparing,
                    ready: result.ready
                },
                itemsByStation,
                averagePrepTime: Math.round(result.avgPrepTime || 0),
                completedToday
            }
        });
    } catch (error) {
        next(error);
    }
};
