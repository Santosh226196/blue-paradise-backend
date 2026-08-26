import Customer from "../models/Customer.js";
import Visit from "../models/Visit.js";
import Membership from "../models/Membership.js";
import Coaching from "../models/Coaching.js";
import Transaction from "../models/Transaction.js";
import Attendance from "../models/Attendance.js";
import DuePayment from "../models/DuePayment.js";

const missing = () => Object.assign(new Error("Customer not found"), { statusCode: 404 });

export async function listCustomers(req, res) {
  const { search, type } = req.query;
  const filter = {};
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["name", "mobile", "aadhaarNumber"].map((field) => ({ [field]: new RegExp(escaped, "i") }));
  }
  if (type) {
    if (!["COACHING", "MEMBERSHIP", "MONTHLY", "QUARTERLY", "YEARLY"].includes(type)) {
      return res.status(400).json({ message: "Unsupported customer type" });
    }
    const ids = type === "COACHING"
      ? await Coaching.distinct("customerId", { status: "ACTIVE" })
      : await Membership.distinct("customerId", { status: "ACTIVE", ...(type !== "MEMBERSHIP" && { membershipType: type }) });
    filter._id = { $in: ids };
  }
  res.json(await Customer.find(filter).sort({ createdAt: -1 }));
}

export async function getCustomer(req, res) {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw missing();
  res.json(customer);
}

export async function createCustomer(req, res) {
  const { id, _id, ...body } = req.body;
  void id; void _id;
  res.status(201).json(await Customer.create({ ...body, firstVisitAt: body.firstVisitAt ?? new Date() }));
}

export async function updateCustomer(req, res) {
  const { id, _id, createdAt, updatedAt, ...body } = req.body;
  void id; void _id; void createdAt; void updatedAt;
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw missing();
  customer.set(body);
  await customer.save();
  res.json(customer);
}

export async function deleteCustomer(req, res) {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw missing();
  await Promise.all([
    Visit.deleteMany({ customerId: customer._id }), Membership.deleteMany({ customerId: customer._id }),
    Coaching.deleteMany({ customerId: customer._id }), Transaction.deleteMany({ customerId: customer._id }),
    Attendance.deleteMany({ customerId: customer._id }), DuePayment.deleteMany({ customerId: customer._id }),
  ]);
  await customer.deleteOne();
  res.json({ success: true });
}

export const getVisits = async (req, res) => res.json(await Visit.find({ customerId: req.params.id }).sort({ visitedAt: -1 }));
export const getMemberships = async (req, res) => res.json(await Membership.find({ customerId: req.params.id }).sort({ startDate: -1 }));
export const getCoaching = async (req, res) => res.json(await Coaching.find({ customerId: req.params.id }).sort({ startDate: -1 }));
export const getTransactions = async (req, res) => res.json(await Transaction.find({ customerId: req.params.id }).sort({ paidAt: -1 }));
