import Transaction from "../models/Transaction.js";
import Counter from "../models/Counter.js";
import BusinessSettings from "../models/BusinessSettings.js";
import Customer from "../models/Customer.js";
import Visit from "../models/Visit.js";
import { dayBounds, getDateRange } from "../utils/dateRange.js";

const missing = () => Object.assign(new Error("Transaction not found"), { statusCode: 404 });

export async function listTransactions(req, res) {
  const hasRange = req.query.from || req.query.to || req.query.period;
  res.json(await Transaction.find(hasRange ? { paidAt: getDateRange(req.query) } : {}).sort({ paidAt: -1 }));
}

export async function getTransaction(req, res) {
  const item = await Transaction.findById(req.params.id);
  if (!item) throw missing();
  res.json(item);
}

export async function createTransaction(req, res) {
  const customerExists = await Customer.exists({ _id: req.body.customerId });
  if (!customerExists) return res.status(400).json({ message: "Customer not found" });
  const currentCounter = await Counter.findById("bill");
  if (!currentCounter) {
    const latest = await Transaction.findOne().sort({ createdAt: -1 }).select("billNumber");
    const lastValue = Number(latest?.billNumber?.match(/(\d+)$/)?.[1] ?? 0);
    await Counter.findByIdAndUpdate("bill", { $max: { value: lastValue } }, { upsert: true, setDefaultsOnInsert: true });
  }
  const [counter, settings] = await Promise.all([
    Counter.findByIdAndUpdate("bill", { $inc: { value: 1 } }, { new: true }),
    BusinessSettings.findOne({ singletonKey: "default" }),
  ]);
  const prefix = settings?.billPrefix ?? "BP";
  const billNumber = `${prefix}${String(counter.value).padStart(6, "0")}`;
  const item = await Transaction.create({ ...req.body, billNumber, paidAt: new Date() });
  res.status(201).json(item);
}

export async function todayTransactions(_req, res) {
  res.json(await Transaction.find({ paidAt: dayBounds() }).sort({ paidAt: -1 }));
}

export async function dashboardStats(_req, res) {
  const today = dayBounds();
  const [totalCustomers, todayVisits, revenue] = await Promise.all([
    Customer.countDocuments(),
    Visit.countDocuments({ visitedAt: today }),
    Transaction.aggregate([{ $match: { paidAt: today } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);
  res.json({ totalCustomers, todayVisits, todayRevenue: revenue[0]?.total ?? 0 });
}
