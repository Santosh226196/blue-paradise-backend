import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayAttendance, attendanceByDate, activeAttendance, checkIn, checkOut } from "../controllers/attendance.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: Attendance tracking
 */

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     tags: [Attendance]
 *     summary: Get today's attendance
 *     responses:
 *       200:
 *         description: Today's attendance
 */
/**
 * @swagger
 * /attendance/active:
 *   get:
 *     tags: [Attendance]
 *     summary: Get currently active (checked-in) records
 *     responses:
 *       200:
 *         description: Active attendance
 */
/**
 * @swagger
 * /attendance/{date}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for a specific date
 *     parameters:
 *       - { in: path, name: date, required: true, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Attendance for date
 */
/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     tags: [Attendance]
 *     summary: Check a customer in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer]
 *             properties:
 *               customer: { type: string }
 *     responses:
 *       201:
 *         description: Checked in
 */
/**
 * @swagger
 * /attendance/{id}/check-out:
 *   post:
 *     tags: [Attendance]
 *     summary: Check a customer out
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Checked out
 */

const router = Router();
router.get("/today", asyncHandler(todayAttendance));
router.get("/active", asyncHandler(activeAttendance));
router.post("/check-in", asyncHandler(checkIn));
router.post("/:id/check-out", asyncHandler(checkOut));
router.get("/:date", asyncHandler(attendanceByDate));
export default router;
