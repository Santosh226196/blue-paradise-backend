import Transaction from "../models/Transaction.js";
import CostumeTransaction from "../models/CostumeTransaction.js";
import { SERVICE_TYPES } from "../models/constants.js";
import { getDateRange } from "../utils/dateRange.js";

const COSTUME_CATEGORY = "COSTUME";

const emptyCategories = () => Object.fromEntries(SERVICE_TYPES.map((type) => [type, { total: 0, count: 0 }]));
const emptyCategory = () => Object.fromEntries([...SERVICE_TYPES, COSTUME_CATEGORY].map((type) => [type, 0]));

function groupFor(date, period) {
  if (period === "hourly") {
    return {
      key: `${date.toISOString().slice(0, 13)}`,
      label: date.toLocaleTimeString("en-US", { hour: "numeric" }),
    };
  }
  if (period === "monthly" || period === "all") {
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
  const range = getDateRange(req.query);
  const period = req.query.period;
  const transactionFilter = Object.keys(range).length ? { paidAt: range } : {};
  const costumeFilter = Object.keys(range).length ? { createdAt: range } : {};

  const [transactions, costumeTxns] = await Promise.all([
    Transaction.find(transactionFilter).sort({ paidAt: 1 }),
    CostumeTransaction.find(costumeFilter).lean(),
  ]);

  const consideredCostume = costumeTxns.filter(
    (item) =>
      (item.type === "SALE" && item.status === "COMPLETED") ||
      (item.type === "RENT" && (item.status === "ACTIVE" || item.status === "RETURNED")),
  );

  const byCategory = emptyCategories();
  const byCategoryTotals = { ...byCategory, [COSTUME_CATEGORY]: { total: 0, count: 0 } };
  const costume = { sale: { total: 0, count: 0 }, rent: { total: 0, count: 0 } };
  const days = new Map();

  let effectivePeriod = period;
  if (period === "all") {
    const allDates = [
      ...transactions.map((item) => item.paidAt),
      ...consideredCostume.map((item) => item.createdAt),
    ];
    if (allDates.length) {
      const first = new Date(Math.min(...allDates.map((date) => date.getTime())));
      const last = new Date(Math.max(...allDates.map((date) => date.getTime())));
      if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
        effectivePeriod = "day";
      }
    }
  }

  const addToDay = (at, amount) => {
    const group = groupFor(at, effectivePeriod);
    if (!days.has(group.key)) days.set(group.key, { period: group.label, date: group.key, total: 0, count: 0, byCategory: emptyCategory() });
    const day = days.get(group.key);
    day.total += amount;
    day.count += 1;
  };

  for (const item of transactions) {
    byCategoryTotals[item.serviceType].total += item.amount;
    byCategoryTotals[item.serviceType].count += 1;
    addToDay(item.paidAt, item.amount);
    days.get(groupFor(item.paidAt, effectivePeriod).key).byCategory[item.serviceType] += item.amount;
  }

  for (const item of consideredCostume) {
    byCategoryTotals[COSTUME_CATEGORY].total += item.totalAmount;
    byCategoryTotals[COSTUME_CATEGORY].count += 1;
    const split = item.type === "SALE" ? costume.sale : costume.rent;
    split.total += item.totalAmount;
    split.count += 1;
    addToDay(item.createdAt, item.totalAmount);
    days.get(groupFor(item.createdAt, effectivePeriod).key).byCategory[COSTUME_CATEGORY] += item.totalAmount;
  }

  res.json({
    totalRevenue: transactions.reduce((sum, item) => sum + item.amount, 0) + byCategoryTotals[COSTUME_CATEGORY].total,
    totalTransactions: transactions.length + byCategoryTotals[COSTUME_CATEGORY].count,
    byCategory: byCategoryTotals,
    dailyRevenue: [...days.values()],
    costume,
  });
}

export async function reportTransactions(req, res) {
  const range = getDateRange(req.query);
  const filter = Object.keys(range).length ? { paidAt: range } : {};
  res.json(await Transaction.find(filter).sort({ paidAt: -1 }));
}
