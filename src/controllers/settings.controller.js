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
  const { id, _id, singletonKey, createdAt, updatedAt, ...changes } = req.body;
  void id; void _id; void singletonKey; void createdAt; void updatedAt;
  let settings = await BusinessSettings.findOne({ singletonKey: "default" });
  if (!settings) settings = new BusinessSettings(defaults);
  if (changes.printerSettings) changes.printerSettings = { ...settings.printerSettings?.toObject(), ...changes.printerSettings };
  if (changes.clubTiming) changes.clubTiming = { ...settings.clubTiming?.toObject(), ...changes.clubTiming };
  settings.set(changes);
  await settings.save();
  res.json(settings);
}
