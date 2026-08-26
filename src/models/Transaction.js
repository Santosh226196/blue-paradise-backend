import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { PAYMENT_METHODS, SERVICE_TYPES } from "./constants.js";

const schema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  serviceType: { type: String, enum: SERVICE_TYPES, required: true, index: true },
  serviceName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  amount: { type: Number, required: true, min: 0.01, max: 10000000 },
  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  paidAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("Transaction", schema);
