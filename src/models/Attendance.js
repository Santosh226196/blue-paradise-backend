import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { VISIT_TYPES } from "./constants.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customerName: { type: String, required: true },
  checkInTime: { type: Date, default: Date.now, index: true },
  checkOutTime: Date,
  isActive: { type: Boolean, default: true },
  visitType: { type: String, enum: VISIT_TYPES, required: true },
  lane: { type: Number, min: 1, max: 50 },
  photoUrl: String,
}, { timestamps: true });
schema.index({ customerId: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
frontendJson(schema);
export default mongoose.model("Attendance", schema);
