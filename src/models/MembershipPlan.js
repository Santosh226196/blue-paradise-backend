import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  duration: { type: String, enum: ["MONTHLY", "QUARTERLY", "YEARLY"], default: "MONTHLY" },
  price: { type: Number, required: true, min: 0 },
  features: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("MembershipPlan", schema);
