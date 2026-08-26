import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  const { default: Attendance } = await import("../models/Attendance.js");
  await Attendance.updateMany({ isActive: { $exists: false }, checkOutTime: { $exists: false } }, { $set: { isActive: true } });
  await Attendance.updateMany({ isActive: { $exists: false }, checkOutTime: { $exists: true } }, { $set: { isActive: false } });
  const duplicateActive = await Attendance.aggregate([
    { $match: { isActive: true } },
    { $sort: { checkInTime: -1 } },
    { $group: { _id: "$customerId", ids: { $push: "$_id" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  for (const group of duplicateActive) {
    await Attendance.updateMany({ _id: { $in: group.ids.slice(1) } }, { $set: { isActive: false } });
  }
  const existingIndex = (await Attendance.collection.indexes()).find((index) => index.name === "customerId_1");
  if (existingIndex && (!existingIndex.unique || existingIndex.partialFilterExpression?.isActive !== true)) {
    await Attendance.collection.dropIndex("customerId_1");
  }
  await Attendance.init();
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
