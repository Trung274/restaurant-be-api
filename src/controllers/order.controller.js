const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Create new order
 * @route   POST /api/v1/orders
 * @access  Private (waiter, manager, admin)
 */
exports.createOrder = async (req, res, next) => {
    try {
        const { tableId, tableNumber, numberOfGuests, items, notes } = req.body;

        // Validate table exists
        const table = await Table.findById(tableId);
        if (!table) {
            return next(new AppError('Table not found', 404));
        }

        // Validate and enrich menu items
        const menuItemIds = items.map(item => item.menuItemId);
        const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

        if (menuItems.length !== menuItemIds.length) {
            return next(new AppError('One or more menu items not found', 404));
        }

        // Create a map for quick lookup
        const menuItemMap = {};
        menuItems.forEach(item => {
            menuItemMap[item._id.toString()] = item;
        });

        // Process items with menu item details
        const processedItems = items.map(item => {
            const menuItem = menuItemMap[item.menuItemId.toString()];

            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                price: menuItem.price,
                subtotal: menuItem.price * item.quantity,
                notes: item.notes || '',
                estimatedTime: item.estimatedTime,
                priority: item.priority || 'normal',
                queuedAt: new Date()
            };
        });

        // Create order
        const order = await Order.create({
            tableId,
            tableNumber: tableNumber || table.number,
            numberOfGuests,
            items: processedItems,
            notes,
            createdBy: req.user._id,
            status: 'pending'
        });

        // Update table status
        table.status = 'occupied';
        table.activeSession = {
            currentGuests: numberOfGuests,
            orderId: order._id,
            checkInTime: new Date()
        };
        await table.save();

        // Populate item details
        await order.populate('items.menuItemId', 'name category image');

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all orders
 * @route   GET /api/v1/orders
 * @access  Private
 */
exports.getOrders = async (req, res, next) => {
    try {
        const { status, tableId, sort = '-createdAt' } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (tableId) {
            query.tableId = tableId;
        }

        const orders = await Order.find(query)
            .sort(sort)
            .populate('tableId', 'number floor section')
            .populate('items.assignedTo', 'name')
            .populate('createdBy', 'name')
            .populate('servedBy', 'name');

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
 * @desc    Get single order
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('tableId', 'number floor section')
            .populate('items.menuItemId', 'name category image price')
            .populate('items.assignedTo', 'name')
            .populate('createdBy', 'name')
            .populate('servedBy', 'name');

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add items to existing order
 * @route   PATCH /api/v1/orders/:id/add-items
 * @access  Private (waiter, manager, admin)
 */
exports.addItemsToOrder = async (req, res, next) => {
    try {
        const { items } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        if (order.status === 'completed' || order.status === 'cancelled') {
            return next(new AppError('Cannot add items to completed or cancelled order', 400));
        }

        // Process new items
        const menuItemIds = items.map(item => item.menuItemId);
        const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

        if (menuItems.length !== menuItemIds.length) {
            return next(new AppError('One or more menu items not found', 404));
        }

        // Create a map for quick lookup
        const menuItemMap = {};
        menuItems.forEach(item => {
            menuItemMap[item._id.toString()] = item;
        });

        const processedItems = items.map(item => {
            const menuItem = menuItemMap[item.menuItemId.toString()];

            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                price: menuItem.price,
                subtotal: menuItem.price * item.quantity,
                notes: item.notes || '',
                estimatedTime: item.estimatedTime,
                priority: item.priority || 'normal',
                kitchenStatus: 'queued',
                queuedAt: new Date()
            };
        });

        // Add items to order
        order.items.push(...processedItems);

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Items added to order',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all items as served
 * @route   PATCH /api/v1/orders/:id/serve-all
 * @access  Private (waiter, manager, admin)
 */
exports.serveAllItems = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        // Check if all items are ready
        const allReady = order.items.every(item =>
            item.kitchenStatus === 'ready' || item.kitchenStatus === 'served'
        );

        if (!allReady) {
            return next(new AppError('Not all items are ready to be served', 400));
        }

        // Mark all items as served
        const now = new Date();
        order.items.forEach(item => {
            if (item.kitchenStatus !== 'served') {
                item.kitchenStatus = 'served';
                item.servedAt = now;
            }
        });

        order.servedBy = req.user._id;
        order.updateOrderStatus();

        await order.save();

        res.status(200).json({
            success: true,
            message: 'All items marked as served',
            data: {
                _id: order._id,
                status: order.status,
                checkOutTime: order.checkOutTime
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel order
 * @route   PATCH /api/v1/orders/:id/cancel
 * @access  Private (waiter, manager, admin)
 */
exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('Order not found', 404));
        }

        if (order.status === 'completed') {
            return next(new AppError('Cannot cancel completed order', 400));
        }

        order.status = 'cancelled';
        await order.save();

        // Update table status
        const table = await Table.findById(order.tableId);
        if (table && table.activeSession?.orderId?.toString() === order._id.toString()) {
            table.status = 'available';
            table.clearSession();
            await table.save();
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/v1/orders/stats
 * @access  Private (manager, admin)
 */
exports.getOrderStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await Order.aggregate([
            {
                $facet: {
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    today: [
                        {
                            $match: {
                                createdAt: { $gte: today }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: '$totalAmount' },
                                avgOrderValue: { $avg: '$totalAmount' }
                            }
                        }
                    ],
                    overall: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: '$totalAmount' }
                            }
                        }
                    ]
                }
            }
        ]);

        const result = stats[0];

        // Format by status
        const byStatus = {};
        result.byStatus.forEach(item => {
            byStatus[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            data: {
                byStatus,
                today: result.today[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
                overall: result.overall[0] || { totalOrders: 0, totalRevenue: 0 }
            }
        });
    } catch (error) {
        next(error);
    }
};
