import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dueCrud, dueSummary, getDuePayment, listDuePayments, markAsPaid } from "../controllers/duePayments.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Due Payments
 *     description: Tracking overdue/outstanding payments
 */

/**
 * @swagger
 * /due-payments/summary:
 *   get:
 *     tags: [Due Payments]
 *     summary: Get outstanding payments summary
 *     responses:
 *       200:
 *         description: Summary
 */
/**
 * @swagger
 * /due-payments:
 *   get:
 *     tags: [Due Payments]
 *     summary: List due payments
 *     responses:
 *       200:
 *         description: List of due payments
 *   post:
 *     tags: [Due Payments]
 *     summary: Create a due payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer: { type: string }
 *               amount: { type: number }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /due-payments/{id}:
 *   get:
 *     tags: [Due Payments]
 *     summary: Get a due payment by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Due payment detail
 *   delete:
 *     tags: [Due Payments]
 *     summary: Delete a due payment
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /due-payments/{id}/pay:
 *   post:
 *     tags: [Due Payments]
 *     summary: Mark a due payment as paid
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Marked as paid
 */

const router = Router();
router.get("/summary", asyncHandler(dueSummary));
router.route("/").get(asyncHandler(listDuePayments)).post(asyncHandler(dueCrud.create));
router.post("/:id/pay", asyncHandler(markAsPaid));
router.route("/:id").get(asyncHandler(getDuePayment)).delete(asyncHandler(dueCrud.remove));
export default router;
