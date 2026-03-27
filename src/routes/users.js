const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRole, requireAdminOrOwner } = require('../middlewares/auth');
const { updateUserRules, statusRules } = require('../middlewares/validate');

/**
 * @swagger
 * tags:
 * name: Users
 * description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 * get:
 * summary: Get all users with pagination and filtering (Admin only)
 * tags: [Users]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * - in: query
 * name: search
 * schema:
 * type: string
 * description: Search by name or email
 * responses:
 * 200:
 * description: Paginated list of users
 * content:
 * application/json:
 * example:
 * success: true
 * data:
 * - id: 1
 * name: "John Doe"
 * email: "john@example.com"
 * role: "user"
 * is_active: true
 * pagination:
 * total: 1
 * page: 1
 * limit: 10
 */
router.get('/', authenticate, requireRole('admin'), userController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 * get:
 * summary: Get user by ID (Admin or account owner)
 * tags: [Users]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * responses:
 * 200:
 * description: User data
 * content:
 * application/json:
 * example:
 * success: true
 * data:
 * id: 1
 * name: "John Doe"
 * email: "john@example.com"
 * role: "user"
 * 404:
 * description: User not found
 */
router.get('/:id', authenticate, requireAdminOrOwner, userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 * put:
 * summary: Update user (Admin or account owner)
 * tags: [Users]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * role:
 * type: string
 * enum: [admin, user]
 * example:
 * name: "John Updated"
 * email: "john_new@example.com"
 * role: "user"
 * responses:
 * 200:
 * description: Updated user successfully
 * content:
 * application/json:
 * example:
 * success: true
 * message: "User updated successfully"
 */
router.put('/:id', authenticate, requireAdminOrOwner, updateUserRules, userController.update);

/**
 * @swagger
 * /api/users/{id}:
 * delete:
 * summary: Delete user (Admin only)
 * tags: [Users]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * responses:
 * 204:
 * description: Deleted successfully
 * 403:
 * description: Forbidden - Admin only
 */
router.delete('/:id', authenticate, requireRole('admin'), userController.remove);

/**
 * @swagger
 * /api/users/{id}/status:
 * patch:
 * summary: Enable or disable user account (Admin only)
 * tags: [Users]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * example: 1
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [is_active]
 * properties:
 * is_active:
 * type: boolean
 * example:
 * is_active: false
 * responses:
 * 200:
 * description: Status updated
 * content:
 * application/json:
 * example:
 * success: true
 * message: "User status updated"
 */
router.patch('/:id/status', authenticate, requireRole('admin'), statusRules, userController.setStatus);

module.exports = router;