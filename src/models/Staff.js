import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { EMAIL_PATTERN, PHONE_PATTERN, isImageValue, normalizeEmail, normalizePhone } from "../utils/normalizers.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  mobile: { type: String, required: true, unique: true, trim: true, set: normalizePhone, match: [PHONE_PATTERN, "mobile must be a valid Indian 10-digit number"] },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, set: normalizeEmail, match: [EMAIL_PATTERN, "email is invalid"] },
  role: { type: String, enum: ["COACH", "LIFEGUARD", "RECEPTIONIST", "MANAGER"], default: "COACH" },
  specialization: { type: String, trim: true, maxlength: 200 },
  isAvailable: { type: Boolean, default: true },
  photoUrl: { type: String, validate: { validator: isImageValue, message: "photoUrl must be a valid image" } },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("Staff", schema);
