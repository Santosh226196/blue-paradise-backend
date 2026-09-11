import Transaction from "../models/Transaction.js";
import Counter from "../models/Counter.js";
import BusinessSettings from "../models/BusinessSettings.js";
import Customer from "../models/Customer.js";
import Visit from "../models/Visit.js";
import Membership from "../models/Membership.js";
import MembershipPlan from "../models/MembershipPlan.js";
import MembershipBatch from "../models/MembershipBatch.js";
import BatchAssignment from "../models/BatchAssignment.js";
import { dayBounds, getDateRange } from "../utils/dateRange.js";

const DURATION_DAYS = { DAILY: 1, WEEKEND: 2, MONTHLY: 30, QUARTERLY: 90, THREE_MONTHS: 90, SIX_MONTHS: 180, YEARLY: 365, FAMILY: 30, STUDENT: 30 };
const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

const missing = () => Object.assign(new Error("Transaction not found"), { statusCode: 404 });

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePageLimit(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 12));
  return { page, limit };
}

export async function listTransactions(req, res) {
  const { page, limit } = parsePageLimit(req.query);
  const hasRange = req.query.from || req.query.to || req.query.period;
  let filter = hasRange ? { paidAt: getDateRange(req.query) } : {};
  const search = String(req.query.search || "").trim();
  if (search) {
    const q = { $regex: escapeRegExp(search), $options: "i" };
    const customerIds = await Customer.find({ $or: [{ name: q }, { mobile: q }] })
      .select("_id")
      .then((docs) => docs.map((c) => c._id));
    const or = [{ billNumber: q }];
    if (customerIds.length) or.push({ customerId: { $in: customerIds } });
    const searchFilter = { $or: or };
    filter = Object.keys(filter).length
      ? { $and: [filter, searchFilter] }
      : searchFilter;
  }
  const [items, stats] = await Promise.all([
    Transaction.find(filter)
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
    ]),
  ]);
  const total = stats[0]?.count ?? 0;
  const totalAmount = Math.round((stats[0]?.totalAmount ?? 0) * 100) / 100;
  res.json({ items, total, totalAmount, page, limit, pages: Math.ceil(total / limit) || 1 });
}

export async function getTransaction(req, res) {
  const item = await Transaction.findById(req.params.id);
  if (!item) throw missing();
  res.json(item);
}

export async function createTransaction(req, res) {
  const { customerId, serviceType, serviceName, amount, paymentMethod, planId, batchId, startDate } = req.body;
  const customerExists = await Customer.exists({ _id: customerId });
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
  const item = await Transaction.create({ customerId, serviceType, serviceName, amount, paymentMethod, billNumber, paidAt: new Date() });

  if (planId && serviceType === "MEMBERSHIP") {
    const plan = await MembershipPlan.findById(planId);
    if (plan) {
      const start = startDate ? new Date(startDate) : new Date();
      const days = DURATION_DAYS[plan.duration] ?? 30;
      const end = new Date(start);
      end.setDate(end.getDate() + days);

      if (batchId) {
        const batch = await MembershipBatch.findById(batchId);
        if (!batch) throw badRequest("Batch not found");
        if (batch.status !== "ACTIVE") throw badRequest("Batch is not active");
        const occupied = await BatchAssignment.countDocuments({ batchId: batch._id, status: "ACTIVE", customerId: { $ne: customerId } });
        if (occupied >= batch.maxMembers) throw badRequest("Batch is full");
      }

      const previousActive = await Membership.find({ customerId, status: "ACTIVE" }).select("_id batchId");
      if (previousActive.length > 0) {
        const previousIds = previousActive.map((m) => m._id);
        await Membership.updateMany(
          { _id: { $in: previousIds } },
          { $set: { status: "EXPIRED" } },
        );
        const activeAssignments = await BatchAssignment.find({
          membershipId: { $in: previousIds },
          status: "ACTIVE",
        });
        if (activeAssignments.length > 0) {
          await BatchAssignment.updateMany(
            { membershipId: { $in: previousIds }, status: "ACTIVE" },
            { $set: { status: "REMOVED", removedAt: new Date() } },
          );
          const batchInc = activeAssignments.reduce((acc, a) => {
            acc[a.batchId] = (acc[a.batchId] ?? 0) + 1;
            return acc;
          }, {});
          await Promise.all(
            Object.entries(batchInc).map(([batchId, count]) =>
              MembershipBatch.findByIdAndUpdate(batchId, { $inc: { currentMembers: -count } }),
            ),
          );
        }
      }

      const membership = await Membership.create({
        customerId,
        planId: plan._id,
        batchId: batchId || null,
        membershipType: plan.duration,
        startDate: start,
        endDate: end,
        amount: plan.price,
        totalSessions: plan.totalSessions ?? null,
        usedSessions: 0,
      });

      if (batchId) {
        await BatchAssignment.create({
          batchId,
          membershipId: membership._id,
          customerId,
          status: "ACTIVE",
          effectiveFrom: start,
          assignedAt: new Date(),
        });
        await MembershipBatch.findByIdAndUpdate(batchId, { $inc: { currentMembers: 1 } });
      }
    }
  }

  res.status(201).json(item);
}

export async function todayTransactions(_req, res) {
  res.json(await Transaction.find({ paidAt: dayBounds() }).sort({ paidAt: -1 }));
}

export async function expiringMemberships(_req, res) {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const memberships = await Membership.find({
    status: "ACTIVE",
    endDate: { $lte: soon },
  }).sort({ endDate: 1 });

  const items = await Promise.all(memberships.map(async (m) => {
    const customer = await Customer.findById(m.customerId).select("name mobile");
    const expired = m.endDate < now;
    return {
      customerId: m.customerId,
      customerName: customer?.name ?? "Unknown",
      customerMobile: customer?.mobile ?? "",
      membershipType: m.membershipType,
      endDate: m.endDate,
      status: expired ? "EXPIRED" : "EXPIRING_SOON",
      daysLeft: Math.round((m.endDate - now) / (24 * 60 * 60 * 1000)),
    };
  }));
  res.json(items);
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
