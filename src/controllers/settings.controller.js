import BusinessSettings from "../models/BusinessSettings.js";
import { DAYS } from "../models/constants.js";

const defaults = {
  singletonKey: "default",
  businessName: "Blue Paradise Water Club",
  printerSettings: { connected: false },
  billPrefix: "BP",
  billFooter: "Thank you for visiting Blue Paradise!",
  clubTiming: { openTime: "05:00", closeTime: "22:00", daysOpen: DAYS, holidaysEnabled: false },
};

export async function getSettings(_req, res) {
  const settings = await BusinessSettings.findOneAndUpdate(
    { singletonKey: "default" }, { $setOnInsert: defaults }, { new: true, upsert: true, runValidators: true },
  );
  res.json(settings);
}

export async function updateSettings(req, res) {
  const { id, _id, createdAt, updatedAt, ...changes } = req.body;
  void id; void _id; void createdAt; void updatedAt;
  await BusinessSettings.findOneAndUpdate(
    { singletonKey: "default" }, { $setOnInsert: defaults }, { upsert: true, runValidators: true },
  );
  const settings = await BusinessSettings.findOneAndUpdate(
    { singletonKey: "default" }, { $set: changes }, { new: true, runValidators: true },
  );
  res.json(settings);
}
