import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";
import { VISIT_TYPES } from "./constants.js";

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  visitType: { type: String, enum: VISIT_TYPES, required: true },
  visitedAt: { type: Date, default: Date.now, index: true },
});
frontendJson(schema);
export default mongoose.model("Visit", schema);
