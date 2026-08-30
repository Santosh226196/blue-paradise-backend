import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Settings
 *     description: Business and application settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get settings
 *     responses:
 *       200:
 *         description: Settings
 *   put:
 *     tags: [Settings]
 *     summary: Update settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */

const router = Router();
router.route("/").get(asyncHandler(getSettings)).put(asyncHandler(updateSettings));
export default router;
