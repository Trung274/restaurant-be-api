const express = require('express');
const router = express.Router();
const {
    getKitchenQueue,
    startPreparingItem,
    markItemReady,
    updateItemPriority,
    getKitchenStats
} = require('../controllers/kitchen.controller');
const { protect, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Kitchen
 *   description: Kitchen operations endpoints
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/kitchen/queue:
 *   get:
 *     summary: Get kitchen queue (Chef/Kitchen-staff/Manager/Admin)
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kitchenStatus
 *         schema:
 *           type: string
 *           enum: [queued, preparing, ready]
 *         description: Filter by item kitchen status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [normal, high, urgent]
 *         description: Filter by item priority
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: checkInTime
 *         description: Sort field
 *     responses:
 *       200:
 *         description: Kitchen queue retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/queue', checkPermission('kitchen', 'read'), getKitchenQueue);

/**
 * @swagger
 * /api/v1/kitchen/stats:
 *   get:
 *     summary: Get kitchen statistics (Manager/Admin)
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kitchen statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     itemsByStatus:
 *                       type: object
 *                       properties:
 *                         queued:
 *                           type: integer
 *                         preparing:
 *                           type: integer
 *                         ready:
 *                           type: integer
 *                     averagePrepTime:
 *                       type: integer
 *                       description: Average preparation time in minutes
 *                     completedToday:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', checkPermission('kitchen', 'stats'), getKitchenStats);

/**
 * @swagger
 * /api/v1/kitchen/items/{itemId}/start:
 *   patch:
 *     summary: Start preparing an item (Chef/Kitchen-staff/Manager/Admin)
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID (from order.items array)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 676e1234567890abcdef1234
 *     responses:
 *       200:
 *         description: Item preparation started
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or item not found
 */
router.patch('/items/:itemId/start', checkPermission('kitchen', 'start'), startPreparingItem);

/**
 * @swagger
 * /api/v1/kitchen/items/{itemId}/ready:
 *   patch:
 *     summary: Mark item as ready (Chef/Kitchen-staff/Manager/Admin)
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID (from order.items array)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 676e1234567890abcdef1234
 *     responses:
 *       200:
 *         description: Item marked as ready
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or item not found
 */
router.patch('/items/:itemId/ready', checkPermission('kitchen', 'ready'), markItemReady);

/**
 * @swagger
 * /api/v1/kitchen/items/{itemId}/priority:
 *   patch:
 *     summary: Update item priority (Manager/Admin)
 *     tags: [Kitchen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID (from order.items array)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - priority
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 676e1234567890abcdef1234
 *               priority:
 *                 type: string
 *                 enum: [normal, high, urgent]
 *                 example: urgent
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or item not found
 */
router.patch('/items/:itemId/priority', checkPermission('kitchen', 'priority'), updateItemPriority);

module.exports = router;
