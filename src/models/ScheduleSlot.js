import mongoose from "mongoose";
import { DAYS } from "./constants.js";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  day: { type: String, enum: DAYS, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, enum: ["LANE", "COACHING", "OPEN_SWIM"], required: true },
  label: { type: String, required: true },
  lane: { type: Number, min: 1 },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  maxCapacity: { type: Number, min: 1, default: 8 },
  currentBookings: { type: Number, min: 0, default: 0 },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("ScheduleSlot", schema);
