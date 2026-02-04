const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    addItemsToOrder,
    serveAllItems,
    cancelOrder,
    getOrderStats
} = require('../controllers/order.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/orders/stats:
 *   get:
 *     summary: Get order statistics (Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', checkPermission('orders', 'read'), getOrderStats);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, ready, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: string
 *         description: Filter by table ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create new order (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableId
 *               - numberOfGuests
 *               - items
 *             properties:
 *               tableId:
 *                 type: string
 *                 example: 676e1234567890abcdef1234
 *               tableNumber:
 *                 type: string
 *                 example: A1
 *               numberOfGuests:
 *                 type: integer
 *                 minimum: 1
 *                 example: 4
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                       example: 676e1234567890abcdef5678
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                     notes:
 *                       type: string
 *                       example: Không hành
 *                     estimatedTime:
 *                       type: integer
 *                       description: Estimated preparation time in minutes
 *                       example: 15
 *                     priority:
 *                       type: string
 *                       enum: [normal, high, urgent]
 *                       default: normal
 *               notes:
 *                 type: string
 *                 example: Special instructions for the order
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Table or menu item not found
 */
router.route('/')
    .get(checkPermission('orders', 'read'), getOrders)
    .post(checkPermission('orders', 'create'), createOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get single order (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.route('/:id')
    .get(checkPermission('orders', 'read'), getOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/add-items:
 *   patch:
 *     summary: Add items to existing order (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     notes:
 *                       type: string
 *                     estimatedTime:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Items added successfully
 *       400:
 *         description: Cannot add items to completed/cancelled order
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or menu item not found
 */
router.patch('/:id/add-items', checkPermission('orders', 'update'), addItemsToOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/serve-all:
 *   patch:
 *     summary: Mark all items as served (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: All items marked as served
 *       400:
 *         description: Not all items are ready
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.patch('/:id/serve-all', checkPermission('orders', 'serve'), serveAllItems);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order (Waiter/Manager/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel completed order
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.patch('/:id/cancel', checkPermission('orders', 'cancel'), cancelOrder);

module.exports = router;
