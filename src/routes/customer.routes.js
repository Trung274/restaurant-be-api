const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/customers/stats:
 *   get:
 *     summary: Get customer statistics (Admin/Manager only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics
 */
router.get('/stats', authorize('admin', 'manager'), getCustomerStats);

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Get all customers (Admin/Manager/Operations)
 *     tags: [Customers]
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
 *         description: Items per page
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, vip]
 *         description: Filter by membership tier
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or phone
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *         description: Filter favorites
 *     responses:
 *       200:
 *         description: List of customers
 *   post:
 *     summary: Create new customer (Admin/Manager/Operations)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *               avatar:
 *                 type: string
 *                 example: https://i.pravatar.cc/150?img=1
 *               membershipTier:
 *                 type: string
 *                 enum: [bronze, silver, gold, vip]
 *                 default: bronze
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Customer already exists
 */
router.route('/')
    .get(authorize('admin', 'manager', 'operations'), getAllCustomers)
    .post(authorize('admin', 'manager', 'operations'), createCustomer);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID (Admin/Manager/Operations)
 *     tags: [Customers]
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
 *         description: Customer details with recent orders
 *       404:
 *         description: Customer not found
 *   put:
 *     summary: Update customer (Admin/Manager only)
 *     tags: [Customers]
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
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *               membershipTier:
 *                 type: string
 *                 enum: [bronze, silver, gold, vip]
 *               points:
 *                 type: number
 *               isFavorite:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *   delete:
 *     summary: Delete customer (Admin/Manager only)
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.route('/:id')
    .get(authorize('admin', 'manager', 'operations'), getCustomerById)
    .put(authorize('admin', 'manager'), updateCustomer)
    .delete(authorize('admin', 'manager'), deleteCustomer);

module.exports = router;
