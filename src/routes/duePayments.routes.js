import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dueCrud, dueSummary, markAsPaid } from "../controllers/duePayments.controller.js";

const router = Router();
router.get("/summary", asyncHandler(dueSummary));
router.route("/").get(asyncHandler(dueCrud.list)).post(asyncHandler(dueCrud.create));
router.post("/:id/pay", asyncHandler(markAsPaid));
router.route("/:id").get(asyncHandler(dueCrud.get)).delete(asyncHandler(dueCrud.remove));
export default router;
