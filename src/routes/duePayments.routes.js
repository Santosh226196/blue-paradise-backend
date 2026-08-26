import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dueCrud, dueSummary, getDuePayment, listDuePayments, markAsPaid } from "../controllers/duePayments.controller.js";

const router = Router();
router.get("/summary", asyncHandler(dueSummary));
router.route("/").get(asyncHandler(listDuePayments)).post(asyncHandler(dueCrud.create));
router.post("/:id/pay", asyncHandler(markAsPaid));
router.route("/:id").get(asyncHandler(getDuePayment)).delete(asyncHandler(dueCrud.remove));
export default router;
