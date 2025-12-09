const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { protect, authorize, checkPermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: Restaurant information endpoints
 */

// All routes require authentication and admin role
router.use(protect);

/**
 * @swagger
 * /api/v1/restaurant:
 *   get:
 *     summary: Get restaurant information
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant information
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
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     address:
 *                       type: string
 *                     openTime:
 *                       type: string
 *                     closeTime:
 *                       type: string
 *                     description:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     isOpen:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', 
  restaurantController.getRestaurant
);

/**
 * @swagger
 * /api/v1/restaurant:
 *   put:
 *     summary: Update restaurant information
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nhà hàng ABC"
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               email:
 *                 type: string
 *                 example: "restaurant@example.com"
 *               address:
 *                 type: string
 *                 example: "123 Đường XYZ, Quận 1, TP.HCM"
 *               openTime:
 *                 type: string
 *                 example: "08:00"
 *                 description: "Format HH:MM (24h)"
 *               closeTime:
 *                 type: string
 *                 example: "22:00"
 *                 description: "Format HH:MM (24h)"
 *               description:
 *                 type: string
 *                 example: "Nhà hàng chuyên phục vụ các món ăn truyền thống"
 *               logo:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Admin only
 */
router.put('/', 
  authorize('admin'),
  checkPermission('restaurant', 'update'),
  restaurantController.updateRestaurant
);

module.exports = router;