import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  role: { type: String, enum: ["COACH", "LIFEGUARD", "RECEPTIONIST", "MANAGER"], default: "COACH" },
  specialization: String,
  isAvailable: { type: Boolean, default: true },
  photoUrl: String,
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("Staff", schema);
