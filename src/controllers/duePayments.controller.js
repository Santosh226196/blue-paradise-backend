import DuePayment from "../models/DuePayment.js";
import Customer from "../models/Customer.js";
import { crudController } from "./crud.controller.js";

export const dueCrud = crudController(DuePayment, "Due payment", {
  listFilter: (req) => req.query.status ? { status: req.query.status } : {},
  createDefaults: async (req) => {
    if (!req.body.customerId) return {};
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) throw Object.assign(new Error("Customer not found"), { statusCode: 400 });
    return { customerName: customer.name, customerMobile: customer.mobile };
  },
  sort: { dueDate: 1 },
});

export async function dueSummary(_req, res) {
  const rows = await DuePayment.aggregate([
    { $match: { status: { $in: ["PENDING", "OVERDUE"] } } },
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const values = Object.fromEntries(rows.map((row) => [row._id, row]));
  res.json({ totalPending: values.PENDING?.total ?? 0, totalOverdue: values.OVERDUE?.total ?? 0, count: rows.reduce((sum, row) => sum + row.count, 0) });
}

export async function markAsPaid(req, res) {
  const item = await DuePayment.findByIdAndUpdate(req.params.id, { status: "PAID", paidAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ message: "Due payment not found" });
  res.json(item);
}
