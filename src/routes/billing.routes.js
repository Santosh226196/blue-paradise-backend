import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listTransactions, getTransaction, createTransaction, todayTransactions, dashboardStats } from "../controllers/billing.controller.js";

const router = Router();
router.get("/dashboard-stats", asyncHandler(dashboardStats));
router.get("/transactions/today", asyncHandler(todayTransactions));
router.route("/transactions").get(asyncHandler(listTransactions)).post(asyncHandler(createTransaction));
router.get("/transactions/:id", asyncHandler(getTransaction));
export default router;
