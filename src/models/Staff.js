import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { EMAIL_PATTERN, PHONE_PATTERN, isImageValue, normalizeEmail, normalizePhone } from "../utils/normalizers.js";

const schema = new mongoose.Schema({
  employeeId: { type: String, trim: true, unique: true, sparse: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  mobile: { type: String, required: true, unique: true, trim: true, set: normalizePhone, match: [PHONE_PATTERN, "mobile must be a valid Indian 10-digit number"] },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, set: normalizeEmail, match: [EMAIL_PATTERN, "email is invalid"] },
  role: { type: String, enum: ["COACH", "LIFEGUARD", "RECEPTIONIST", "MANAGER"], default: "COACH" },
  specialization: { type: String, trim: true, maxlength: 200 },
  isAvailable: { type: Boolean, default: true },
  photoUrl: { type: String, validate: { validator: isImageValue, message: "photoUrl must be a valid image" } },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.pre("save", async function assignEmployeeId(next) {
  if (!this.isNew || !this.employeeId) {
    const last = await this.constructor.findOne({}, { employeeId: 1 }).sort({ employeeId: -1 });
    const seq = last?.employeeId
      ? parseInt(String(last.employeeId).split("-").pop(), 10) || 0
      : 0;
    this.employeeId = `BP-STAFF-${String(seq + 1).padStart(3, "0")}`;
  }
  next();
});
frontendJson(schema);
export default mongoose.model("Staff", schema);
