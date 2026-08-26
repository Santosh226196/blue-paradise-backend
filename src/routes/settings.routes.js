import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";

const router = Router();
router.route("/").get(asyncHandler(getSettings)).put(asyncHandler(updateSettings));
export default router;
