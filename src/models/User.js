import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { frontendJson } from "./plugins.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, trim: true, lowercase: true },
  mobile: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  resetOtpHash: { type: String, select: false },
  resetOtpExpiresAt: { type: Date, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};
userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
frontendJson(userSchema);

export default mongoose.model("User", userSchema);
