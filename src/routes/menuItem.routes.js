const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItem.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Menu Items
 *   description: Menu item management endpoints
 */

/**
 * @swagger
 * /api/v1/menu-items/stats:
 *   get:
 *     summary: Get menu statistics (Public)
 *     tags: [Menu Items]
 *     responses:
 *       200:
 *         description: Menu statistics by category and summary
 */
router.get('/stats', menuItemController.getMenuStats);

/**
 * @swagger
 * /api/v1/menu-items:
 *   get:
 *     summary: Get all menu items (Public)
 *     tags: [Menu Items]
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Món chính, Khai vị, Món đặc biệt, Đồ uống, Tráng miệng]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, out_of_stock, discontinued]
 *         description: Filter by status
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Filter by popular items
 *       - in: query
 *         name: vegetarian
 *         schema:
 *           type: boolean
 *         description: Filter by vegetarian items
 *       - in: query
 *         name: spicy
 *         schema:
 *           type: boolean
 *         description: Filter by spicy items
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by fields (e.g., price, -rating, name)
 *     responses:
 *       200:
 *         description: List of menu items
 */
router.get('/', menuItemController.getAllMenuItems);

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   get:
 *     summary: Get menu item by ID (Public)
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item data
 *       404:
 *         description: Menu item not found
 */
router.get('/:id', menuItemController.getMenuItemById);

/**
 * @swagger
 * /api/v1/menu-items:
 *   post:
 *     summary: Create menu item (Admin/Manager only)
 *     tags: [Menu Items]
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
 *               - category
 *               - price
 *               - image
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phở bò đặc biệt
 *               category:
 *                 type: string
 *                 enum: [Món chính, Khai vị, Món đặc biệt, Đồ uống, Tráng miệng]
 *                 example: Món chính
 *               price:
 *                 type: number
 *                 example: 85000
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               description:
 *                 type: string
 *                 example: Phở bò truyền thống với nước dùng hầm xương 12 tiếng
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 4.8
 *               reviews:
 *                 type: number
 *                 example: 124
 *               status:
 *                 type: string
 *                 enum: [available, out_of_stock, discontinued]
 *                 default: available
 *               popular:
 *                 type: boolean
 *                 default: false
 *               spicy:
 *                 type: boolean
 *                 default: false
 *               vegetarian:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Menu item created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, authorize('admin', 'manager'), menuItemController.createMenuItem);

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   put:
 *     summary: Update menu item (Admin/Manager only)
 *     tags: [Menu Items]
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
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *               reviews:
 *                 type: number
 *               status:
 *                 type: string
 *               popular:
 *                 type: boolean
 *               spicy:
 *                 type: boolean
 *               vegetarian:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu item updated
 *       404:
 *         description: Menu item not found
 */
router.put('/:id', protect, authorize('admin', 'manager'), menuItemController.updateMenuItem);

/**
 * @swagger
 * /api/v1/menu-items/{id}:
 *   delete:
 *     summary: Delete menu item (Admin/Manager only)
 *     tags: [Menu Items]
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
 *         description: Menu item deleted
 *       404:
 *         description: Menu item not found
 */
router.delete('/:id', protect, authorize('admin', 'manager'), menuItemController.deleteMenuItem);

module.exports = router;
