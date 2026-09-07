import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { crudController } from "../controllers/crud.controller.js";
import { listBatchMembers, assignMembership, changeBatch, unassignBatch } from "../controllers/batchAssignment.controller.js";
import MembershipPlan from "../models/MembershipPlan.js";
import MembershipBatch from "../models/MembershipBatch.js";
import Staff from "../models/Staff.js";
import ScheduleSlot from "../models/ScheduleSlot.js";
import Announcement from "../models/Announcement.js";
import { DAYS } from "../models/constants.js";

/**
 * @swagger
 * tags:
 *   - name: Membership Plans
 *   - name: Membership Batches
 *   - name: Staff
 *   - name: Schedule
 *   - name: Announcements
 */

/**
 * @swagger
 * /membership-plans:
 *   get:
 *     tags: [Membership Plans]
 *     summary: List membership plans
 *     responses:
 *       200:
 *         description: List of plans
 *   post:
 *     tags: [Membership Plans]
 *     summary: Create a membership plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               durationDays: { type: integer }
 *               features: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /membership-plans/{id}:
 *   get:
 *     tags: [Membership Plans]
 *     summary: Get a plan by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Plan detail
 *   put:
 *     tags: [Membership Plans]
 *     summary: Update a plan
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
 *     tags: [Membership Plans]
 *     summary: Delete a plan
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /membership-batches:
 *   get:
 *     tags: [Membership Batches]
 *     summary: List membership batches
 *     responses:
 *       200:
 *         description: List of batches
 *   post:
 *     tags: [Membership Batches]
 *     summary: Create a membership batch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate, maxMembers]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               planId: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               maxMembers: { type: integer }
 *               status: { type: string, enum: [ACTIVE, UPCOMING, COMPLETED, CANCELLED] }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /membership-batches/{id}:
 *   get:
 *     tags: [Membership Batches]
 *     summary: Get a batch by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Batch detail
 *   put:
 *     tags: [Membership Batches]
 *     summary: Update a batch
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
 *     tags: [Membership Batches]
 *     summary: Delete a batch
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /staff:
 *   get:
 *     tags: [Staff]
 *     summary: List staff
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string, enum: [COACH, LIFEGUARD, RECEPTIONIST, MANAGER] } }
 *     responses:
 *       200:
 *         description: List of staff
 *   post:
 *     tags: [Staff]
 *     summary: Create a staff member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               mobile: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     tags: [Staff]
 *     summary: Get a staff member by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Staff detail
 *   put:
 *     tags: [Staff]
 *     summary: Update a staff member
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
 *     tags: [Staff]
 *     summary: Delete a staff member
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /schedule:
 *   get:
 *     tags: [Schedule]
 *     summary: List schedule slots
 *     parameters:
 *       - { in: query, name: day, schema: { type: string } }
 *     responses:
 *       200:
 *         description: List of slots
 *   post:
 *     tags: [Schedule]
 *     summary: Create a schedule slot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /schedule/{id}:
 *   get:
 *     tags: [Schedule]
 *     summary: Get a slot by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Slot detail
 *   put:
 *     tags: [Schedule]
 *     summary: Update a slot
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
 *     tags: [Schedule]
 *     summary: Delete a slot
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List announcements
 *     responses:
 *       200:
 *         description: List of announcements
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /announcements/active:
 *   get:
 *     tags: [Announcements]
 *     summary: List active announcements
 *     responses:
 *       200:
 *         description: List of active announcements
 */
/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get an announcement by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Announcement detail
 *   put:
 *     tags: [Announcements]
 *     summary: Update an announcement
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
 *     tags: [Announcements]
 *     summary: Delete an announcement
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */

function resourceRouter(controller, { beforeId } = {}) {
  const router = Router();
  if (beforeId) beforeId(router);
  router.route("/").get(asyncHandler(controller.list)).post(asyncHandler(controller.create));
  router.route("/:id").get(asyncHandler(controller.get)).put(asyncHandler(controller.update)).delete(asyncHandler(controller.remove));
  return router;
}

export const membershipPlansRouter = resourceRouter(crudController(MembershipPlan, "Membership plan", { sort: { createdAt: -1 } }));

export const membershipBatchesRouter = resourceRouter(crudController(MembershipBatch, "Membership batch", { sort: { createdAt: -1 } }), {
  beforeId: (router) => {
    router.get("/:id/members", asyncHandler(listBatchMembers));
    router.post("/:id/assign", asyncHandler(assignMembership));
    router.post("/:id/change", asyncHandler(changeBatch));
    router.post("/:id/unassign", asyncHandler(unassignBatch));
  },
});

export const staffRouter = resourceRouter(crudController(Staff, "Staff member", {
  listFilter: (req) => {
    const filter = {};
    if (req.query.search) {
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ name: new RegExp(escaped, "i") }, { mobile: new RegExp(escaped, "i") }];
    }
    if (req.query.role) {
      if (!["COACH", "LIFEGUARD", "RECEPTIONIST", "MANAGER"].includes(req.query.role)) {
        throw Object.assign(new Error("Unsupported staff role"), { statusCode: 400 });
      }
      filter.role = req.query.role;
    }
    return filter;
  },
  sort: { joinedAt: -1 },
}));

export const scheduleRouter = resourceRouter(crudController(ScheduleSlot, "Schedule slot", {
  listFilter: (req) => {
    if (req.query.day && !DAYS.includes(req.query.day)) throw Object.assign(new Error("Unsupported schedule day"), { statusCode: 400 });
    return req.query.day ? { day: req.query.day } : {};
  },
  sort: { day: 1, startTime: 1 },
}));

const announcementsCrud = crudController(Announcement, "Announcement", { sort: { createdAt: -1 } });
export const announcementsRouter = resourceRouter(announcementsCrud, {
  beforeId: (router) => router.get("/active", asyncHandler(async (_req, res) => {
    const now = new Date();
    res.json(await Announcement.find({ isActive: true, $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] }).sort({ createdAt: -1 }));
  })),
});
