import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipBatch", default: null },
  membershipType: { type: String, enum: ["DAILY", "WEEKEND", "MONTHLY", "QUARTERLY", "THREE_MONTHS", "SIX_MONTHS", "YEARLY", "FAMILY", "STUDENT"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01, max: 10000000 },
  totalSessions: { type: Number, default: null, min: 0, max: 100000 },
  usedSessions: { type: Number, default: 0, min: 0, max: 100000 },
  status: { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
  purchasedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.pre("validate", function validateDates() {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) this.invalidate("endDate", "endDate must be after startDate");
  if (this.totalSessions != null && this.usedSessions > this.totalSessions) this.invalidate("usedSessions", "usedSessions cannot exceed totalSessions");
});
frontendJson(schema);
export default mongoose.model("Membership", schema);
