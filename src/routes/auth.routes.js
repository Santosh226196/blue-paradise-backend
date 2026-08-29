import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, changePassword, forgotPassword, verifyOtp, resetPassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and account management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with credentials
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@blueparadise.com }
 *               password: { type: string, format: password, example: admin123 }
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests
 */
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out current session
 *     security: []
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password of authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: admin@blueparadise.com }
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a password reset OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with verified OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Success
 */

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });
router.use(limiter);
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.post("/change-password", requireAuth, asyncHandler(changePassword));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.post("/reset-password", asyncHandler(resetPassword));
export default router;
