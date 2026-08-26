import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { AADHAAR_PATTERN, EMAIL_PATTERN, PHONE_PATTERN, isImageValue, normalizeAadhaar, normalizeEmail, normalizePhone } from "../utils/normalizers.js";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  mobile: { type: String, required: true, unique: true, trim: true, set: normalizePhone, match: [PHONE_PATTERN, "mobile must be a valid Indian 10-digit number"] },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, set: normalizeEmail, match: [EMAIL_PATTERN, "email is invalid"] },
  aadhaarNumber: { type: String, trim: true, sparse: true, unique: true, set: normalizeAadhaar, match: [AADHAAR_PATTERN, "aadhaarNumber must be a valid 12-digit number"] },
  age: { type: Number, min: 1, max: 120, validate: { validator: Number.isInteger, message: "age must be a whole number" } },
  gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
  address: { type: String, trim: true, maxlength: 500 },
  photoUrl: { type: String, validate: { validator: isImageValue, message: "photoUrl must be a valid image" } },
  idCardPhoto: { type: String, validate: { validator: isImageValue, message: "idCardPhoto must be a valid image" } },
  firstVisitAt: { type: Date, default: Date.now },
}, { timestamps: true });

customerSchema.index({ name: "text", mobile: "text", aadhaarNumber: "text" });
frontendJson(customerSchema);
export default mongoose.model("Customer", customerSchema);
