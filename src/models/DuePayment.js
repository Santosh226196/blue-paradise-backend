import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ["PENDING", "OVERDUE", "PAID"], default: "PENDING", index: true },
  paidAt: Date,
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("DuePayment", schema);
