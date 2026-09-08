import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listCostumes,
  getCostumesStats,
  getCostume,
  getCostumeSummary,
  createCostume,
  updateCostume,
  deleteCostume,
  listCostumeTransactions,
  createCostumeTransaction,
  returnCostumeTransaction,
} from "../controllers/costumes.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Costumes
 *     description: Swim costume inventory management (variants, sales, rentals)
 */

/**
 * @swagger
 * /costumes:
 *   get:
 *     tags: [Costumes]
 *     summary: List costumes (paginated)
 *     parameters:
 *       - { in: query, name: page, schema: { type: number } }
 *       - { in: query, name: limit, schema: { type: number } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [MENS, WOMENS, KIDS, UNISEX] } }
 *     responses:
 *       200:
 *         description: Paginated costume list
 *   post:
 *     tags: [Costumes]
 *     summary: Create a costume with variants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [MENS, WOMENS, KIDS, UNISEX] }
 *               price: { type: number }
 *               rentPrice: { type: number }
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     size: { type: string }
 *                     color: { type: string }
 *                     stock: { type: number }
 *                     price: { type: number }
 *               isActive: { type: boolean }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /costumes/stats:
 *   get:
 *     tags: [Costumes]
 *     summary: Global costume inventory + sell/rent totals
 *     responses:
 *       200:
 *         description: Stats object
 */

/**
 * @swagger
 * /costumes/{id}:
 *   get:
 *     tags: [Costumes]
 *     summary: Get a costume by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Costume detail
 *   put:
 *     tags: [Costumes]
 *     summary: Update a costume (full replacement of variants)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   delete:
 *     tags: [Costumes]
 *     summary: Delete a costume and its transactions
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */

/**
 * @swagger
 * /costumes/{id}/summary:
 *   get:
 *     tags: [Costumes]
 *     summary: Per-costume summary (sell out, rent, revenue, stock)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *
 * /costumes/{id}/transactions:
 *   get:
 *     tags: [Costumes]
 *     summary: List costume transactions (buyer/rent records)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [SALE, RENT] } }
 *       - { in: query, name: status, schema: { type: string, enum: [COMPLETED, ACTIVE, RETURNED] } }
 *   post:
 *     tags: [Costumes]
 *     summary: Record a sale or rent (updates stock)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, customerName, quantity]
 *             properties:
 *               type: { type: string, enum: [SALE, RENT] }
 *               size: { type: string }
 *               color: { type: string }
 *               customerId: { type: string }
 *               customerName: { type: string }
 *               customerMobile: { type: string }
 *               quantity: { type: number }
 *               unitPrice: { type: number }
 *               notes: { type: string }
 *
 * /costumes/{id}/transactions/{txnId}/return:
 *   post:
 *     tags: [Costumes]
 *     summary: Mark a rent returned and restore stock
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: txnId, required: true, schema: { type: string } }
 */

const router = Router();
router.get("/stats", asyncHandler(getCostumesStats));
router.route("/")
  .get(asyncHandler(listCostumes))
  .post(asyncHandler(createCostume));
router.route("/:id")
  .get(asyncHandler(getCostume))
  .put(asyncHandler(updateCostume))
  .delete(asyncHandler(deleteCostume));
router.get("/:id/summary", asyncHandler(getCostumeSummary));
router.get("/:id/transactions", asyncHandler(listCostumeTransactions));
router.post("/:id/transactions", asyncHandler(createCostumeTransaction));
router.post("/:id/transactions/:txnId/return", asyncHandler(returnCostumeTransaction));

export default router;