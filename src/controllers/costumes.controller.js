import mongoose from "mongoose";
import Costume from "../models/Costume.js";
import CostumeTransaction from "../models/CostumeTransaction.js";

const notFound = Object.assign(new Error("Costume not found"), { statusCode: 404 });
const COSTUME_TYPES = ["MENS", "WOMENS", "KIDS", "UNISEX"];
const MAX_LIMIT = 100;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePageLimit(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 12));
  return { page, limit };
}

function findVariantIndex(costume, { size = "", color = "" } = {}) {
  const targetSize = String(size).trim().toLowerCase();
  const targetColor = String(color).trim().toLowerCase();
  return costume.variants.findIndex(
    (v) =>
      String(v.size || "").trim().toLowerCase() === targetSize &&
      String(v.color || "").trim().toLowerCase() === targetColor,
  );
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Paginated list with search + type filter. Returns { items, total, page, limit, pages }. */
export async function listCostumes(req, res) {
  const { page, limit } = parsePageLimit(req.query);

  const filter = {};
  if (req.query.search) {
    const escaped = escapeRegExp(req.query.search);
    filter.$or = [
      { name: new RegExp(escaped, "i") },
      { "variants.color": new RegExp(escaped, "i") },
      { notes: new RegExp(escaped, "i") },
    ];
  }
  if (req.query.type) {
    const type = String(req.query.type).toUpperCase();
    if (!COSTUME_TYPES.includes(type)) {
      throw Object.assign(new Error("Unsupported costume type"), { statusCode: 400 });
    }
    filter.type = type;
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const [items, total] = await Promise.all([
    Costume.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Costume.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
}

/** Global dashboard stats across all costumes. */
export async function getCostumesStats(req, res) {
  const [totalCostumes, stockAgg, saleAgg, rentAgg] = await Promise.all([
    Costume.countDocuments({}),
    Costume.aggregate([
      { $unwind: "$variants" },
      { $group: { _id: null, totalStock: { $sum: "$variants.stock" } } },
    ]),
    CostumeTransaction.aggregate([
      { $match: { type: "SALE", status: "COMPLETED" } },
      { $group: { _id: null, totalQty: { $sum: "$quantity" }, totalAmount: { $sum: "$totalAmount" } } },
    ]),
    CostumeTransaction.aggregate([
      { $match: { type: "RENT" } },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$quantity" },
          totalRevenue: {
            $sum: { $cond: [{ $in: ["$status", ["ACTIVE", "RETURNED"]] }, "$totalAmount", 0] },
          },
        },
      },
    ]),
  ]);

  res.json({
    totalCostumes,
    totalStock: stockAgg[0]?.totalStock ?? 0,
    totalSoldQty: saleAgg[0]?.totalQty ?? 0,
    totalRevenue: saleAgg[0]?.totalAmount ?? 0,
    totalRentQty: rentAgg[0]?.totalQty ?? 0,
    totalRentRevenue: rentAgg[0]?.totalRevenue ?? 0,
  });
}

export async function getCostume(req, res) {
  const item = await Costume.findById(req.params.id);
  if (!item) throw notFound;
  res.json(item);
}

/** Per-costume summary (sell out, amount, current stock). */
export async function getCostumeSummary(req, res) {
  const id = req.params.id;

  const [costume, saleAgg, rentAgg] = await Promise.all([
    Costume.findById(id),
    CostumeTransaction.aggregate([
      { $match: { costumeId: new mongoose.Types.ObjectId(id), type: "SALE", status: "COMPLETED" } },
      { $group: { _id: null, totalQty: { $sum: "$quantity" }, totalAmount: { $sum: "$totalAmount" } } },
    ]),
    CostumeTransaction.aggregate([
      { $match: { costumeId: new mongoose.Types.ObjectId(id), type: "RENT" } },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$quantity" },
          totalRevenue: {
            $sum: { $cond: [{ $in: ["$status", ["ACTIVE", "RETURNED"]] }, "$totalAmount", 0] },
          },
          activeQty: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, "$quantity", 0] },
          },
        },
      },
    ]),
  ]);
  if (!costume) throw notFound;

  res.json({
    soldQty: saleAgg[0]?.totalQty ?? 0,
    soldRevenue: saleAgg[0]?.totalAmount ?? 0,
    rentQty: rentAgg[0]?.totalQty ?? 0,
    rentRevenue: rentAgg[0]?.totalRevenue ?? 0,
    activeRentQty: rentAgg[0]?.activeQty ?? 0,
    currentStock: costume.variants.reduce((sum, v) => sum + (v.stock || 0), 0),
    variants: costume.variants.map((v) => ({ ...v.toObject(), stock: v.stock || 0 })),
  });
}

export async function createCostume(req, res) {
  const payload = { ...req.body, _id: undefined, id: undefined };
  const variants = Array.isArray(payload.variants)
    ? payload.variants
        .map(({ size, color, stock, price }) => ({
          size: String(size ?? "").trim(),
          color: String(color ?? "").trim(),
          stock: Math.max(0, parseInt(stock, 10) || 0),
          price: parseOptionalNumber(price),
        }))
        .filter((v) => v.size)
    : [];
  delete payload.variants;

  const item = await Costume.create({ ...payload, variants });
  res.status(201).json(item);
}

export async function updateCostume(req, res) {
  const { id: _id, _id: mongoId, createdAt, updatedAt, ...changes } = req.body;
  void _id; void mongoId; void createdAt; void updatedAt;

  if (Array.isArray(changes.variants)) {
    changes.variants = changes.variants
      .map(({ size, color, stock, price }) => ({
        size: String(size ?? "").trim(),
        color: String(color ?? "").trim(),
        stock: Math.max(0, parseInt(stock, 10) || 0),
        price: parseOptionalNumber(price),
      }))
      .filter((v) => v.size);
  }

  const item = await Costume.findById(req.params.id);
  if (!item) throw notFound;
  item.set(changes);
  await item.save();
  res.json(item);
}

export async function deleteCostume(req, res) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const deleted = await Costume.findByIdAndDelete(req.params.id).session(session);
      if (!deleted) throw notFound;
      await CostumeTransaction.deleteMany({ costumeId: deleted._id }).session(session);
      result = deleted;
    });
    res.json({ success: true, id: result._id });
  } finally {
    await session.endSession();
  }
}

export async function listCostumeTransactions(req, res) {
  const { page, limit } = parsePageLimit(req.query);
  const filter = { costumeId: req.params.id };
  if (req.query.type) filter.type = String(req.query.type).toUpperCase();
  if (req.query.status) filter.status = String(req.query.status).toUpperCase();

  const [items, total] = await Promise.all([
    CostumeTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CostumeTransaction.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
}

/**
 * Record a sale or rent. Sale decrements stock permanently; rent decrements
 * available stock and restores it when the item is marked returned.
 */
export async function createCostumeTransaction(req, res) {
  const body = req.body || {};
  const type = String(body.type || "").toUpperCase();
  if (!["SALE", "RENT"].includes(type)) {
    throw Object.assign(new Error("type must be SALE or RENT"), { statusCode: 400 });
  }
  const quantity = parseInt(body.quantity, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw Object.assign(new Error("quantity must be at least 1"), { statusCode: 400 });
  }
  if (!body.customerName || !String(body.customerName).trim()) {
    throw Object.assign(new Error("customerName is required"), { statusCode: 422 });
  }

  const session = await mongoose.startSession();
  try {
    let saved;
    await session.withTransaction(async () => {
      const costume = await Costume.findById(req.params.id).session(session);
      if (!costume) throw notFound;

      let variant;
      let variantIndex = -1;
      if (costume.variants.length) {
        variantIndex = findVariantIndex(costume, { size: body.size, color: body.color });
        if (variantIndex === -1) {
          throw Object.assign(new Error("Select a valid size and color combination"), { statusCode: 400 });
        }
        variant = costume.variants[variantIndex];
        if (variant.stock < quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${costume.name}`), { statusCode: 409 });
        }
      }

      const isRent = type === "RENT";
      const usedPrice =
        isRent && costume.rentPrice
          ? costume.rentPrice
          : (parseOptionalNumber(body.unitPrice) ?? variant?.price ?? costume.price ?? 0);

      const record = await CostumeTransaction.create(
        [
          {
            costumeId: costume._id,
            costumeName: costume.name,
            costumeType: costume.type,
            variant: variant
              ? { size: variant.size, color: variant.color }
              : { size: body.size || "", color: body.color || "" },
            type,
            customerId: body.customerId || null,
            customerName: String(body.customerName).trim(),
            customerMobile: body.customerMobile || "",
            quantity,
            unitPrice: usedPrice,
            totalAmount: usedPrice * quantity,
            status: isRent ? "ACTIVE" : "COMPLETED",
            notes: body.notes || "",
          },
        ],
        { session },
      );
      saved = record[0];

      if (variant) {
        costume.variants[variantIndex].stock = variant.stock - quantity;
        await costume.save({ session });
      }
    });
    res.status(201).json(saved);
  } finally {
    await session.endSession();
  }
}

/** Mark an active rent as returned and restore its stock. */
export async function returnCostumeTransaction(req, res) {
  const session = await mongoose.startSession();
  try {
    let saved;
    await session.withTransaction(async () => {
      const txn = await CostumeTransaction.findOne({
        _id: req.params.txnId,
        costumeId: req.params.id,
        type: "RENT",
      }).session(session);
      if (!txn) {
        throw Object.assign(new Error("Active rent record not found"), { statusCode: 404 });
      }
      if (txn.status !== "ACTIVE") {
        throw Object.assign(new Error("Rent already marked returned"), { statusCode: 409 });
      }

      txn.status = "RETURNED";
      if (txn.variant?.size) {
        const costume = await Costume.findById(txn.costumeId).session(session);
        if (costume?.variants.length) {
          const idx = findVariantIndex(costume, txn.variant);
          if (idx !== -1) {
            costume.variants[idx].stock += txn.quantity;
            await costume.save({ session });
          }
        }
      }
      await txn.save({ session });
      saved = txn;
    });
    res.json(saved);
  } finally {
    await session.endSession();
  }
}