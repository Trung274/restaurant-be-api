const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /api/v1/payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
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
 *                     overall:
 *                       type: object
 *                     today:
 *                       type: object
 *                     thisMonth:
 *                       type: object
 *                     byPaymentMethod:
 *                       type: array
 *                     refunds:
 *                       type: object
 */
router.get('/stats', protect, authorize('admin', 'manager', 'accountant'), paymentController.getPaymentStats);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, card, others, bank-transfer]
 *         description: Filter by payment method
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: tableNumber
 *         schema:
 *           type: string
 *         description: Filter by table number
 *     responses:
 *       200:
 *         description: List of payments
 *   post:
 *     summary: Create payment (Process payment for an order)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Order ID to process payment for
 *                 example: 677f1234567890abcdef1234
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, others, bank-transfer]
 *                 description: Payment method (default cash)
 *                 example: cash
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: Customer paid by cash
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid request or order already paid
 *       404:
 *         description: Order not found
 */
router.route('/')
    .get(protect, authorize('admin', 'manager', 'accountant'), paymentController.getAllPayments)
    .post(protect, authorize('admin', 'manager', 'operations'), paymentController.createPayment);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:id', protect, authorize('admin', 'manager', 'accountant'), paymentController.getPaymentById);

module.exports = router;
