import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, changePassword, forgotPassword, verifyOtp, resetPassword } from "../controllers/auth.controller.js";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });
router.use(limiter);
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.post("/change-password", asyncHandler(changePassword));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.post("/reset-password", asyncHandler(resetPassword));
export default router;
