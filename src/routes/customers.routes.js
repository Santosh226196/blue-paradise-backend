import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listCustomers, listCustomersWithoutPlan, getCustomer, createCustomer, updateCustomer, deleteCustomer, getVisits, getMemberships, getCoaching, getTransactions, getCostumeTransactions } from "../controllers/customers.controller.js";
import { activeBatchesForCustomer } from "../controllers/batchAssignment.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer management
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         mobile: { type: string }
 *         email: { type: string }
 *         createdAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Customers]
 *     summary: List customers
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Search by name or mobile }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Customer' }
 *   post:
 *     tags: [Customers]
 *     summary: Create a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, mobile]
 *             properties:
 *               name: { type: string }
 *               mobile: { type: string }
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /customers/no-plan:
 *   get:
 *     tags: [Customers]
 *     summary: List customers who have not purchased any plan yet
 *     responses:
 *       200:
 *         description: List of customers without a plan
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Customer' }
 */
/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Customer detail
 *   put:
 *     tags: [Customers]
 *     summary: Update a customer
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Customers]
 *     summary: Delete a customer
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /customers/{id}/visits:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer's visits
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Visits
 */
/**
 * @swagger
 * /customers/{id}/memberships:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer's memberships
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Memberships
 */
/**
 * @swagger
 * /customers/{id}/coaching:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer's coaching records
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Coaching
 */
/**
 * @swagger
 * /customers/{id}/transactions:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer's transactions
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Transactions
 */

const router = Router();
router.route("/").get(asyncHandler(listCustomers)).post(asyncHandler(createCustomer));
router.get("/no-plan", asyncHandler(listCustomersWithoutPlan));
router.get("/:id/visits", asyncHandler(getVisits));
router.get("/:id/memberships", asyncHandler(getMemberships));
router.get("/:id/coaching", asyncHandler(getCoaching));
router.get("/:id/transactions", asyncHandler(getTransactions));
router.get("/:id/costume-transactions", asyncHandler(getCostumeTransactions));
router.get("/:id/batches", asyncHandler(activeBatchesForCustomer));
router.route("/:id").get(asyncHandler(getCustomer)).put(asyncHandler(updateCustomer)).delete(asyncHandler(deleteCustomer));
export default router;
