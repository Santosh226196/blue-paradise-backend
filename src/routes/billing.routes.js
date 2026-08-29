import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listTransactions, getTransaction, createTransaction, todayTransactions, dashboardStats } from "../controllers/billing.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Billing
 *     description: Transactions and billing
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         customer: { type: string }
 *         amount: { type: number }
 *         type: { type: string }
 *         createdAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /billing/dashboard-stats:
 *   get:
 *     tags: [Billing]
 *     summary: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
/**
 * @swagger
 * /billing/transactions/today:
 *   get:
 *     tags: [Billing]
 *     summary: Get today's transactions
 *     responses:
 *       200:
 *         description: Today's transactions
 */
/**
 * @swagger
 * /billing/transactions:
 *   get:
 *     tags: [Billing]
 *     summary: List transactions
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: startDate, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Transaction' }
 *   post:
 *     tags: [Billing]
 *     summary: Create a transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               customer: { type: string }
 *               amount: { type: number }
 *               type: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /billing/transactions/{id}:
 *   get:
 *     tags: [Billing]
 *     summary: Get a transaction by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Transaction detail
 */

const router = Router();
router.get("/dashboard-stats", asyncHandler(dashboardStats));
router.get("/transactions/today", asyncHandler(todayTransactions));
router.route("/transactions").get(asyncHandler(listTransactions)).post(asyncHandler(createTransaction));
router.get("/transactions/:id", asyncHandler(getTransaction));
export default router;
