import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  aadhaarNumber: { type: String, trim: true, sparse: true, unique: true },
  age: { type: Number, min: 0, max: 120 },
  gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
  address: { type: String, trim: true },
  photoUrl: String,
  idCardPhoto: String,
  firstVisitAt: { type: Date, default: Date.now },
}, { timestamps: true });

customerSchema.index({ name: "text", mobile: "text", aadhaarNumber: "text" });
frontendJson(customerSchema);
export default mongoose.model("Customer", customerSchema);
