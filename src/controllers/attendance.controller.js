import Attendance from "../models/Attendance.js";
import Customer from "../models/Customer.js";
import Visit from "../models/Visit.js";
import { dayBounds } from "../utils/dateRange.js";

export async function todayAttendance(_req, res) {
  res.json(await Attendance.find({ checkInTime: dayBounds() }).sort({ checkInTime: -1 }));
}

export async function attendanceByDate(req, res) {
  res.json(await Attendance.find({ checkInTime: dayBounds(req.params.date) }).sort({ checkInTime: -1 }));
}

export async function activeAttendance(_req, res) {
  res.json(await Attendance.find({ isActive: true }).sort({ checkInTime: -1 }));
}

export async function checkIn(req, res) {
  const { customerId, visitType, lane, photoUrl } = req.body;
  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(400).json({ message: "Customer not found" });
  const active = await Attendance.exists({ customerId: customer._id, isActive: true });
  if (active) return res.status(409).json({ message: "Customer is already checked in" });
  const record = await Attendance.create({ customerId: customer._id, customerName: customer.name, visitType, lane, photoUrl, checkInTime: new Date(), isActive: true });
  await Visit.create({ customerId: customer._id, visitType, visitedAt: record.checkInTime });
  res.status(201).json(record);
}

export async function checkOut(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Attendance record not found" });
  if (!record.isActive || record.checkOutTime) return res.status(409).json({ message: "Customer has already checked out" });
  record.checkOutTime = new Date();
  record.isActive = false;
  await record.save();
  res.json(record);
}
