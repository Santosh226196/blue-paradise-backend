import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSettings, updateSettings, uploadScanner, deleteScanner, getScannerPublic } from "../controllers/settings.controller.js";
import { requireAuth } from "../middleware/auth.js";

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
router.post("/scanner", asyncHandler(uploadScanner));
router.delete("/scanner", asyncHandler(deleteScanner));

const publicRouter = Router();
publicRouter.get("/scanner", asyncHandler(getScannerPublic));

export default router;
export { publicRouter };
