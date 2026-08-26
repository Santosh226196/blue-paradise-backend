import Attendance from "../models/Attendance.js";
import Customer from "../models/Customer.js";
import Visit from "../models/Visit.js";
import { dayBounds } from "../utils/dateRange.js";

export async function todayAttendance(_req, res) {
  res.json(await Attendance.find({ checkInTime: dayBounds() }).sort({ checkInTime: -1 }));
}

export async function attendanceByDate(req, res) {
  const date = new Date(`${req.params.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return res.status(400).json({ message: "Date must use YYYY-MM-DD format" });
  res.json(await Attendance.find({ checkInTime: dayBounds(date) }).sort({ checkInTime: -1 }));
}

export async function activeAttendance(_req, res) {
  res.json(await Attendance.find({ checkOutTime: { $exists: false } }).sort({ checkInTime: -1 }));
}

export async function checkIn(req, res) {
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).json({ message: "Customer not found" });
  const active = await Attendance.exists({ customerId: customer._id, checkOutTime: { $exists: false } });
  if (active) return res.status(409).json({ message: "Customer is already checked in" });
  const record = await Attendance.create({ ...req.body, customerName: req.body.customerName || customer.name, checkInTime: new Date() });
  await Visit.create({ customerId: customer._id, visitType: req.body.visitType, visitedAt: record.checkInTime });
  res.status(201).json(record);
}

export async function checkOut(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Attendance record not found" });
  if (record.checkOutTime) return res.status(409).json({ message: "Customer has already checked out" });
  record.checkOutTime = new Date();
  await record.save();
  res.json(record);
}
