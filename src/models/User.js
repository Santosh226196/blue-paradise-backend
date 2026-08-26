import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { frontendJson } from "./plugins.js";
import { EMAIL_PATTERN, PHONE_PATTERN, normalizeEmail, normalizePhone } from "../utils/normalizers.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 50, match: [/^[a-z0-9._-]+$/, "username contains invalid characters"] },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true, set: normalizeEmail, match: [EMAIL_PATTERN, "email is invalid"] },
  mobile: { type: String, trim: true, unique: true, sparse: true, set: normalizePhone, match: [PHONE_PATTERN, "mobile must be a valid Indian 10-digit number"] },
  passwordHash: { type: String, required: true, select: false },
  resetOtpHash: { type: String, select: false },
  resetOtpExpiresAt: { type: Date, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.methods.setPassword = async function setPassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must be 8-128 characters and contain a letter and number");
  }
  this.passwordHash = await bcrypt.hash(password, 12);
};
userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
frontendJson(userSchema);

export default mongoose.model("User", userSchema);
