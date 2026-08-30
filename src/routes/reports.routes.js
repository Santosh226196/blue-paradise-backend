import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { revenueReport, reportTransactions } from "../controllers/reports.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Financial and operational reports
 */

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Get revenue report
 *     parameters:
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Revenue report
 */
/**
 * @swagger
 * /reports/transactions:
 *   get:
 *     tags: [Reports]
 *     summary: Get transaction report
 *     parameters:
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Transaction report
 */

const router = Router();
router.get("/revenue", asyncHandler(revenueReport));
router.get("/transactions", asyncHandler(reportTransactions));
export default router;
