import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  duration: { type: String, enum: ["DAILY", "WEEKEND", "MONTHLY", "THREE_MONTHS", "SIX_MONTHS", "YEARLY", "FAMILY", "STUDENT"], default: "MONTHLY" },
  price: { type: Number, required: true, min: 0.01, max: 10000000 },
  totalSessions: { type: Number, default: null, min: 0, max: 100000 },
  features: [{ type: String, trim: true, maxlength: 100 }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("MembershipPlan", schema);
