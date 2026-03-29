const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *           example:
 *             name: "Test User"
 *             email: "test@example.com"
 *             password: "Password123"
 *             is_active: true
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จ
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already in use
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             email: "test@example.com"
 *             password: "Password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ ได้รับ accessToken และ refreshToken
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: ต่ออายุ Access Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *           example:
 *             refreshToken: "eyJ..."
 *     responses:
 *       200:
 *         description: ได้รับ accessToken ใหม่
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดูข้อมูลตัวเอง
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูล user ที่ login อยู่
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.me);

module.exports = router;