const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tables
 *   description: Table management endpoints
 */

/**
 * @swagger
 * /api/v1/tables/stats:
 *   get:
 *     summary: Get table statistics (Public)
 *     tags: [Tables]
 *     responses:
 *       200:
 *         description: Table statistics by floor, section, and summary
 */
router.get('/stats', tableController.getTableStats);

/**
 * @swagger
 * /api/v1/tables:
 *   get:
 *     summary: Get all tables (Public)
 *     tags: [Tables]
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
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [Main, VIP, Outdoor]
 *         description: Filter by section
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, occupied, reserved, cleaning]
 *         description: Filter by status
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: number
 *         description: Minimum capacity filter
 *       - in: query
 *         name: maxCapacity
 *         schema:
 *           type: number
 *         description: Maximum capacity filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by fields (e.g., number, capacity, -status)
 *     responses:
 *       200:
 *         description: List of tables
 */
router.get('/', tableController.getAllTables);

/**
 * @swagger
 * /api/v1/tables/{id}:
 *   get:
 *     summary: Get table by ID (Public)
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table data with active order details
 *       404:
 *         description: Table not found
 */
router.get('/:id', tableController.getTableById);

/**
 * @swagger
 * /api/v1/tables:
 *   post:
 *     summary: Create new table (Admin/Manager only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - capacity
 *               - floor
 *               - section
 *             properties:
 *               number:
 *                 type: string
 *                 example: "01"
 *               capacity:
 *                 type: number
 *                 example: 4
 *               floor:
 *                 type: string
 *                 example: "Tầng 1"
 *               section:
 *                 type: string
 *                 enum: [Main, VIP, Outdoor]
 *                 example: Main
 *     responses:
 *       201:
 *         description: Table created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, authorize('admin', 'manager'), tableController.createTable);

/**
 * @swagger
 * /api/v1/tables/{id}:
 *   put:
 *     summary: Update table configuration (Admin/Manager only)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               capacity:
 *                 type: number
 *               floor:
 *                 type: string
 *               section:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       404:
 *         description: Table not found
 */
router.put('/:id', protect, authorize('admin', 'manager'), tableController.updateTable);

/**
 * @swagger
 * /api/v1/tables/{id}:
 *   delete:
 *     summary: Delete table (Admin/Manager only)
 *     tags: [Tables]
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
 *         description: Table deleted successfully
 *       400:
 *         description: Cannot delete occupied table
 *       404:
 *         description: Table not found
 */
router.delete('/:id', protect, authorize('admin', 'manager'), tableController.deleteTable);

/**
 * @swagger
 * /api/v1/tables/{id}/check-in:
 *   post:
 *     summary: Check-in table (Operations/Manager/Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guests
 *             properties:
 *               guests:
 *                 type: number
 *                 example: 4
 *     responses:
 *       200:
 *         description: Table checked in successfully
 *       400:
 *         description: Table is not available
 *       404:
 *         description: Table not found
 */
router.post('/:id/check-in', protect, authorize('operations', 'manager', 'admin'), tableController.checkInTable);

/**
 * @swagger
 * /api/v1/tables/{id}/reserve:
 *   post:
 *     summary: Reserve table (Operations/Manager/Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationTime
 *               - customerName
 *               - customerPhone
 *             properties:
 *               reservationTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-18T18:00:00Z"
 *               customerName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               customerPhone:
 *                 type: string
 *                 example: "0123456789"
 *               guests:
 *                 type: number
 *                 example: 4
 *     responses:
 *       200:
 *         description: Table reserved successfully
 *       400:
 *         description: Table is not available
 *       404:
 *         description: Table not found
 */
router.post('/:id/reserve', protect, authorize('operations', 'manager', 'admin'), tableController.reserveTable);

/**
 * @swagger
 * /api/v1/tables/{id}/checkout:
 *   post:
 *     summary: Checkout table (Operations/Manager/Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, e-wallet, bank-transfer]
 *                 example: cash
 *               tax:
 *                 type: number
 *                 example: 10000
 *               serviceCharge:
 *                 type: number
 *                 example: 5000
 *               discount:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: Table checked out successfully
 *       400:
 *         description: Table is not occupied
 *       404:
 *         description: Table not found
 */
router.post('/:id/checkout', protect, authorize('operations', 'manager', 'admin'), tableController.checkoutTable);

/**
 * @swagger
 * /api/v1/tables/{id}/clean:
 *   post:
 *     summary: Clean table and mark as available (Operations/Manager/Admin)
 *     tags: [Tables]
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
 *         description: Table cleaned successfully
 *       400:
 *         description: Table is not in cleaning status
 *       404:
 *         description: Table not found
 */
router.post('/:id/clean', protect, authorize('operations', 'manager', 'admin'), tableController.cleanTable);

module.exports = router;
