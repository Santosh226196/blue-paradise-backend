import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  customerMobile: { type: String, required: true, match: [/^[6-9]\d{9}$/, "customerMobile is invalid"] },
  description: { type: String, required: true, trim: true, minlength: 2, maxlength: 500 },
  amount: { type: Number, required: true, min: 0.01, max: 10000000 },
  dueDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ["PENDING", "OVERDUE", "PAID"], default: "PENDING", index: true },
  paidAt: Date,
}, { timestamps: true });
schema.pre("validate", function validatePaymentState() {
  if (this.status === "PAID" && !this.paidAt) this.paidAt = new Date();
  if (this.status !== "PAID") this.paidAt = undefined;
});
frontendJson(schema);
export default mongoose.model("DuePayment", schema);
