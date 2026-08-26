import mongoose from "mongoose";
import { DAYS } from "./constants.js";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  day: { type: String, enum: DAYS, required: true, index: true },
  startTime: { type: String, required: true, match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "startTime must use 24-hour HH:mm format"] },
  endTime: { type: String, required: true, match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "endTime must use 24-hour HH:mm format"] },
  type: { type: String, enum: ["LANE", "COACHING", "OPEN_SWIM"], required: true },
  label: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  lane: { type: Number, min: 1, max: 10, validate: { validator: Number.isInteger, message: "lane must be a whole number" } },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    validate: {
      validator: async (value) => !value || Boolean(await mongoose.model("Staff").exists({ _id: value })),
      message: "coachId must reference an existing staff member",
    },
  },
  maxCapacity: { type: Number, min: 1, max: 500, default: 8, validate: { validator: Number.isInteger, message: "maxCapacity must be a whole number" } },
  currentBookings: { type: Number, min: 0, max: 500, default: 0, validate: { validator: Number.isInteger, message: "currentBookings must be a whole number" } },
}, { timestamps: true });
schema.pre("validate", function validateSlot() {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) this.invalidate("endTime", "endTime must be after startTime");
  if (this.currentBookings > this.maxCapacity) this.invalidate("currentBookings", "currentBookings cannot exceed maxCapacity");
});
frontendJson(schema);
export default mongoose.model("ScheduleSlot", schema);
