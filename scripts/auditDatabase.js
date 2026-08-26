import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";
import Customer from "../src/models/Customer.js";
import Visit from "../src/models/Visit.js";
import Membership from "../src/models/Membership.js";
import Coaching from "../src/models/Coaching.js";
import Transaction from "../src/models/Transaction.js";
import MembershipPlan from "../src/models/MembershipPlan.js";
import Staff from "../src/models/Staff.js";
import Attendance from "../src/models/Attendance.js";
import DuePayment from "../src/models/DuePayment.js";
import ScheduleSlot from "../src/models/ScheduleSlot.js";
import Announcement from "../src/models/Announcement.js";
import BusinessSettings from "../src/models/BusinessSettings.js";
import Counter from "../src/models/Counter.js";

const models = [User, Customer, Visit, Membership, Coaching, Transaction, MembershipPlan, Staff, Attendance, DuePayment, ScheduleSlot, Announcement, BusinessSettings, Counter];

async function duplicateCount(Model, field) {
  const rows = await Model.aggregate([
    { $match: { [field]: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "groups" },
  ]);
  return rows[0]?.groups ?? 0;
}

async function invalidCount(Model) {
  const documents = await Model.find().select("+passwordHash +resetOtpHash +resetOtpExpiresAt +resetTokenHash +resetTokenExpiresAt");
  let invalid = 0;
  for (const document of documents) {
    try { await document.validate(); } catch { invalid += 1; }
  }
  return invalid;
}

async function orphanCount(Model, localField, Parent) {
  const parentCollection = Parent.collection.name;
  const rows = await Model.aggregate([
    { $match: { [localField]: { $exists: true, $ne: null } } },
    { $lookup: { from: parentCollection, localField, foreignField: "_id", as: "parent" } },
    { $match: { parent: { $size: 0 } } },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}

async function run() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000, autoIndex: false });
  const counts = Object.fromEntries(await Promise.all(models.map(async (Model) => [Model.modelName, await Model.countDocuments()])));
  const invalidDocuments = Object.fromEntries(await Promise.all(models.map(async (Model) => [Model.modelName, await invalidCount(Model)])));
  const duplicates = {
    userUsername: await duplicateCount(User, "username"),
    userEmail: await duplicateCount(User, "email"),
    userMobile: await duplicateCount(User, "mobile"),
    customerMobile: await duplicateCount(Customer, "mobile"),
    customerAadhaar: await duplicateCount(Customer, "aadhaarNumber"),
    staffMobile: await duplicateCount(Staff, "mobile"),
    billNumber: await duplicateCount(Transaction, "billNumber"),
    settingsSingleton: await duplicateCount(BusinessSettings, "singletonKey"),
  };
  const orphans = {
    visits: await orphanCount(Visit, "customerId", Customer),
    memberships: await orphanCount(Membership, "customerId", Customer),
    coaching: await orphanCount(Coaching, "customerId", Customer),
    transactions: await orphanCount(Transaction, "customerId", Customer),
    attendance: await orphanCount(Attendance, "customerId", Customer),
    duePayments: await orphanCount(DuePayment, "customerId", Customer),
    scheduleCoaches: await orphanCount(ScheduleSlot, "coachId", Staff),
  };
  const duplicateActiveAttendance = await Attendance.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$customerId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "count" },
  ]);
  const inconsistentDuePayments = await DuePayment.countDocuments({
    $or: [
      { status: "PAID", paidAt: { $exists: false } },
      { status: { $ne: "PAID" }, paidAt: { $exists: true } },
    ],
  });
  const billCounter = await Counter.findById("bill");
  const latestBill = await Transaction.findOne().sort({ createdAt: -1 }).select("billNumber");
  const latestBillSequence = Number(latestBill?.billNumber?.match(/(\d+)$/)?.[1] ?? 0);
  const report = {
    database: mongoose.connection.name,
    counts,
    invalidDocuments,
    duplicates,
    orphans,
    duplicateActiveAttendance: duplicateActiveAttendance[0]?.count ?? 0,
    inconsistentDuePayments,
    counterBehindLatestBill: (billCounter?.value ?? 0) < latestBillSequence,
  };
  console.log(JSON.stringify(report, null, 2));
  const issueCount = [
    ...Object.values(invalidDocuments), ...Object.values(duplicates), ...Object.values(orphans),
    report.duplicateActiveAttendance, report.inconsistentDuePayments, Number(report.counterBehindLatestBill),
  ].reduce((sum, value) => sum + Number(value), 0);
  if (issueCount) process.exitCode = 2;
}

run().catch((error) => {
  console.error(JSON.stringify({ error: error.name, message: error.message }, null, 2));
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
