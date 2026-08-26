import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { crudController } from "../controllers/crud.controller.js";
import MembershipPlan from "../models/MembershipPlan.js";
import Staff from "../models/Staff.js";
import ScheduleSlot from "../models/ScheduleSlot.js";
import Announcement from "../models/Announcement.js";
import { DAYS } from "../models/constants.js";

function resourceRouter(controller, { beforeId } = {}) {
  const router = Router();
  if (beforeId) beforeId(router);
  router.route("/").get(asyncHandler(controller.list)).post(asyncHandler(controller.create));
  router.route("/:id").get(asyncHandler(controller.get)).put(asyncHandler(controller.update)).delete(asyncHandler(controller.remove));
  return router;
}

export const membershipPlansRouter = resourceRouter(crudController(MembershipPlan, "Membership plan", { sort: { createdAt: -1 } }));

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
