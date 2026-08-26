import Transaction from "../models/Transaction.js";
import { SERVICE_TYPES } from "../models/constants.js";
import { getDateRange } from "../utils/dateRange.js";

const emptyCategories = () => Object.fromEntries(SERVICE_TYPES.map((type) => [type, { total: 0, count: 0 }]));

function groupFor(date, period) {
  if (period === "hourly") {
    return {
      key: `${date.toISOString().slice(0, 13)}`,
      label: date.toLocaleTimeString("en-US", { hour: "numeric" }),
    };
  }
  if (period === "monthly") {
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
  }
  if (period === "yearly") return { key: String(date.getFullYear()), label: String(date.getFullYear()) };
  return {
    key: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
}

export async function revenueReport(req, res) {
  const paidAt = getDateRange(req.query);
  const transactions = await Transaction.find({ paidAt }).sort({ paidAt: 1 });
  const byCategory = emptyCategories();
  const days = new Map();
  for (const item of transactions) {
    byCategory[item.serviceType].total += item.amount;
    byCategory[item.serviceType].count += 1;
    const group = groupFor(item.paidAt, req.query.period);
    if (!days.has(group.key)) days.set(group.key, { period: group.label, date: group.key, total: 0, count: 0, byCategory: Object.fromEntries(SERVICE_TYPES.map((type) => [type, 0])) });
    const day = days.get(group.key);
    day.total += item.amount;
    day.count += 1;
    day.byCategory[item.serviceType] += item.amount;
  }
  res.json({
    totalRevenue: transactions.reduce((sum, item) => sum + item.amount, 0),
    totalTransactions: transactions.length,
    byCategory,
    dailyRevenue: [...days.values()],
  });
}

export async function reportTransactions(req, res) {
  res.json(await Transaction.find({ paidAt: getDateRange(req.query) }).sort({ paidAt: -1 }));
}
