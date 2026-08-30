import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { DAYS } from "./constants.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: [String], enum: DAYS, default: [] },
  startTime: { type: String, match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "startTime must be HH:mm"], default: "" },
  endTime: { type: String, match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "endTime must be HH:mm"], default: "" },
  level: { type: String, enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], default: "BEGINNER" },
  ageGroup: { type: String, enum: ["KIDS", "TEENS", "ADULTS", "ALL"], default: "ALL" },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  coach: { type: String, trim: true, maxlength: 100, default: "" },
  maxMembers: { type: Number, required: true, min: 1, max: 100000 },
  currentMembers: { type: Number, default: 0, min: 0, max: 100000 },
  status: { type: String, enum: ["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"], default: "ACTIVE" },
}, { timestamps: true });
schema.pre("validate", function validateDates() {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) this.invalidate("endDate", "endDate must be after startDate");
  if (this.startTime && this.endTime && this.endTime <= this.startTime) this.invalidate("endTime", "endTime must be after startTime");
  if (this.currentMembers > this.maxMembers) this.invalidate("currentMembers", "currentMembers cannot exceed maxMembers");
});
frontendJson(schema);
export default mongoose.model("MembershipBatch", schema);
