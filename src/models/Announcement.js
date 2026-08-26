import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("Announcement", schema);
