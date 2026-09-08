import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    category: { type: String, required: true, trim: true },
    frequencyDays: { type: Number, required: true, min: 1 },
    lastDone: Date,
    nextDue: Date,
    status: { type: String, enum: ["upcoming", "overdue", "completed"], default: "upcoming" },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);
frontendJson(schema);
export default mongoose.model("PoolService", schema);