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
  billPrefix: { type: String, default: "BP", trim: true, uppercase: true },
  billFooter: { type: String, default: "Thank you for visiting Blue Paradise!" },
  clubTiming: {
    openTime: { type: String, default: "05:00" },
    closeTime: { type: String, default: "22:00" },
    daysOpen: [{ type: String, enum: DAYS }],
    holidaysEnabled: { type: Boolean, default: false },
  },
}, { timestamps: true });
frontendJson(schema);
export default mongoose.model("BusinessSettings", schema);
