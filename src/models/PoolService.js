import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
  category: { type: String, default: "Cleaning", trim: true, maxlength: 50 },
  frequencyDays: { type: Number, required: true, min: 1 },
  lastDone: Date,
  nextDue: Date,
  status: { type: String, enum: ["upcoming", "overdue", "completed"], default: "upcoming" },
  notes: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });

schema.pre("validate", function preSavePoolService(next) {
  if (this.lastDone && !this.nextDue) {
    const d = new Date(this.lastDone);
    d.setDate(d.getDate() + this.frequencyDays);
    this.nextDue = d;
  }
  next();
});

frontendJson(schema);
export default mongoose.model("PoolService", schema);
