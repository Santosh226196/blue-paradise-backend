import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayAttendance, attendanceByDate, activeAttendance, checkIn, checkOut } from "../controllers/attendance.controller.js";

const router = Router();
router.get("/today", asyncHandler(todayAttendance));
router.get("/active", asyncHandler(activeAttendance));
router.post("/check-in", asyncHandler(checkIn));
router.post("/:id/check-out", asyncHandler(checkOut));
router.get("/:date", asyncHandler(attendanceByDate));
export default router;
