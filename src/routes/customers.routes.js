import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getVisits, getMemberships, getCoaching, getTransactions } from "../controllers/customers.controller.js";

const router = Router();
router.route("/").get(asyncHandler(listCustomers)).post(asyncHandler(createCustomer));
router.get("/:id/visits", asyncHandler(getVisits));
router.get("/:id/memberships", asyncHandler(getMemberships));
router.get("/:id/coaching", asyncHandler(getCoaching));
router.get("/:id/transactions", asyncHandler(getTransactions));
router.route("/:id").get(asyncHandler(getCustomer)).put(asyncHandler(updateCustomer)).delete(asyncHandler(deleteCustomer));
export default router;
