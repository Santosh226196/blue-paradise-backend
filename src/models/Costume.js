import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, maxlength: 20 },
    color: { type: String, trim: true, maxlength: 50 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, min: 0 },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    type: { type: String, enum: ["MENS", "WOMENS", "KIDS", "UNISEX"], default: "UNISEX" },
    price: { type: Number, required: true, min: 0 },
    rentPrice: { type: Number, min: 0, default: 0 },
    variants: { type: [variantSchema], default: [] },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);
frontendJson(schema);
export default mongoose.model("Costume", schema);