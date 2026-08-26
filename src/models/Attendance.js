import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { VISIT_TYPES } from "./constants.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  customerName: { type: String, required: true },
  checkInTime: { type: Date, default: Date.now, index: true },
  checkOutTime: Date,
  visitType: { type: String, enum: VISIT_TYPES, required: true },
  lane: { type: Number, min: 1 },
  photoUrl: String,
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("Attendance", schema);
