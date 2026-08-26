import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { revenueReport, reportTransactions } from "../controllers/reports.controller.js";

const router = Router();
router.get("/revenue", asyncHandler(revenueReport));
router.get("/transactions", asyncHandler(reportTransactions));
export default router;
