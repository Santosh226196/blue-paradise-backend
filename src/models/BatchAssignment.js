import mongoose from "mongoose";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipBatch", required: true, index: true },
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: "Membership", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  status: { type: String, enum: ["ACTIVE", "REMOVED", "COMPLETED"], default: "ACTIVE" },
  effectiveFrom: { type: Date, default: null },
  reason: { type: String, trim: true, maxlength: 500, default: "" },
  assignedAt: { type: Date, default: Date.now },
  removedAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ batchId: 1, status: 1 });
schema.index({ customerId: 1, status: 1 });
frontendJson(schema);
export default mongoose.model("BatchAssignment", schema);
