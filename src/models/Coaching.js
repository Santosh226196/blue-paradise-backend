import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  coachingType: { type: String, enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01, max: 10000000 },
  status: { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
}, { timestamps: true });
schema.pre("validate", function validateDates() {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) this.invalidate("endDate", "endDate must be after startDate");
});
frontendJson(schema);
export default mongoose.model("Coaching", schema);
