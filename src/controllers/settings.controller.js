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

export async function uploadScanner(req, res) {
  const { scannerImage } = req.body;
  if (!scannerImage || typeof scannerImage !== "string") {
    return res.status(400).json({ message: "scannerImage is required" });
  }
  let settings = await BusinessSettings.findOne({ singletonKey: "default" });
  if (!settings) settings = new BusinessSettings(defaults);
  settings.scannerImage = scannerImage;
  await settings.save();
  res.json({ success: true, scannerImage: settings.scannerImage });
}

export async function deleteScanner(_req, res) {
  let settings = await BusinessSettings.findOne({ singletonKey: "default" });
  if (!settings) settings = new BusinessSettings(defaults);
  settings.scannerImage = null;
  await settings.save();
  res.json({ success: true });
}

export async function getScannerPublic(_req, res) {
  const settings = await BusinessSettings.findOne({ singletonKey: "default" }).select("scannerImage businessName");
  if (!settings || !settings.scannerImage) {
    return res.status(404).json({ message: "No scanner image available" });
  }
  res.json({ scannerImage: settings.scannerImage, businessName: settings.businessName });
}
