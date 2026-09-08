import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const variantRefSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true, maxlength: 20 },
    color: { type: String, trim: true, maxlength: 50 },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    costumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Costume", required: true, index: true },
    costumeName: { type: String, trim: true, maxlength: 150 },
    costumeType: { type: String, enum: ["MENS", "WOMENS", "KIDS", "UNISEX"], default: "UNISEX" },
    variant: { type: variantRefSchema, default: () => ({}) },
    type: { type: String, enum: ["SALE", "RENT"], required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, required: true, trim: true, maxlength: 150 },
    customerMobile: { type: String, trim: true, maxlength: 20 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["COMPLETED", "ACTIVE", "RETURNED"],
      default: "COMPLETED",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);
schema.index({ costumeId: 1, type: 1, status: 1 });
frontendJson(schema);
export default mongoose.model("CostumeTransaction", schema);