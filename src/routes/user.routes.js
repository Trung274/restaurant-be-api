const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, authorize('admin'), userController.getAllUsers);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics (Admin/Manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
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
 *                     total:
 *                       type: integer
 *                       description: Total number of users
 *                     active:
 *                       type: integer
 *                       description: Number of active users
 *                     inactive:
 *                       type: integer
 *                       description: Number of inactive users
 *                     byRole:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byWorkStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byShift:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           shift:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', protect, authorize('admin', 'manager'), userController.getUserStats);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Current password is incorrect
 */
router.put('/change-password', protect, userController.changePassword);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     description: |
 *       Update user information.
 *       **Permissions:**
 *       * **Admin**: Can update ALL fields for ANY user.
 *       * **Manager**: Can update `shift` and `workStatus` for ANY user; can update OWN personal info; CANNOT update personal info of others.
 *       * **User/Owner**: Can ONLY update OWN personal info (name, email, avatar, phone, bio).
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 description: URL of user avatar image
 *               phone:
 *                 type: string
 *                 description: User phone number (10-15 digits)
 *               bio:
 *                 type: string
 *                 description: User biography (max 500 characters)
 *               shift:
 *                 type: string
 *                 description: Work shift - Admin/Manager only
 *               workStatus:
 *                 type: string
 *                 enum: [active, on_leave, inactive]
 *                 description: Work status - Admin/Manager only
 *               isActive:
 *                 type: boolean
 *                 description: Account active status - Admin only
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/:id', protect, userController.updateUser);



/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;