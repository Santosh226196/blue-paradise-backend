import mongoose from "mongoose";
import { DAYS } from "./constants.js";
import { frontendJson } from "./plugins.js";

const schema = new mongoose.Schema({
  singletonKey: { type: String, default: "default", unique: true, select: false },
  businessName: { type: String, default: "Blue Paradise Water Club" },
  logo: String,
  printerSettings: {
    connected: { type: Boolean, default: false },
    model: String,
  },
  billPrefix: { type: String, default: "BP", trim: true, uppercase: true, match: [/^[A-Z0-9]{1,8}$/, "billPrefix must be 1-8 letters or numbers"] },
  billFooter: { type: String, default: "Thank you for visiting Blue Paradise!" },
  clubTiming: {
    openTime: { type: String, default: "05:00" },
    closeTime: { type: String, default: "22:00" },
    daysOpen: [{ type: String, enum: DAYS }],
    holidaysEnabled: { type: Boolean, default: false },
  },
}, { timestamps: true });
schema.pre("validate", function validateTiming() {
  const pattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!pattern.test(this.clubTiming?.openTime ?? "")) this.invalidate("clubTiming.openTime", "openTime must use 24-hour HH:mm format");
  if (!pattern.test(this.clubTiming?.closeTime ?? "")) this.invalidate("clubTiming.closeTime", "closeTime must use 24-hour HH:mm format");
  if (this.clubTiming?.openTime && this.clubTiming?.closeTime && this.clubTiming.closeTime <= this.clubTiming.openTime) {
    this.invalidate("clubTiming.closeTime", "closeTime must be after openTime");
  }
});
frontendJson(schema);
export default mongoose.model("BusinessSettings", schema);
