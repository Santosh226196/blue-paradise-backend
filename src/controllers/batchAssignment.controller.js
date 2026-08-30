import BatchAssignment from "../models/BatchAssignment.js";
import Membership from "../models/Membership.js";
import MembershipBatch from "../models/MembershipBatch.js";
import Customer from "../models/Customer.js";
import MembershipPlan from "../models/MembershipPlan.js";

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });
const notFound = (label) => Object.assign(new Error(`${label} not found`), { statusCode: 404 });

export async function listBatchMembers(req, res) {
  const batch = await MembershipBatch.findById(req.params.id);
  if (!batch) throw notFound("Batch");
  const assignments = await BatchAssignment.find({
    batchId: batch._id,
    status: "ACTIVE",
  }).sort({ assignedAt: 1 });

  const members = await Promise.all(assignments.map(async (a) => {
    const [customer, membership] = await Promise.all([
      Customer.findById(a.customerId).select("name mobile photoUrl"),
      Membership.findById(a.membershipId),
    ]);
    return {
      assignmentId: a._id,
      customerId: a.customerId,
      customerName: customer?.name ?? "Unknown",
      customerMobile: customer?.mobile ?? "",
      customerPhoto: customer?.photoUrl ?? null,
      membershipId: a.membershipId,
      membershipType: membership?.membershipType ?? null,
      membershipStatus: membership?.status ?? null,
      endDate: membership?.endDate ?? null,
      assignedAt: a.assignedAt,
      effectiveFrom: a.effectiveFrom,
    };
  }));

  res.json({
    batch: {
      id: batch._id,
      name: batch.name,
      maxMembers: batch.maxMembers,
    },
    members,
    availableSeats: Math.max(batch.maxMembers - members.length, 0),
  });
}

export async function assignMembership(req, res) {
  const { membershipId } = req.body;
  const batch = await MembershipBatch.findById(req.params.id);
  if (!batch) throw notFound("Batch");
  if (batch.status !== "ACTIVE") throw badRequest("Batch is not active");
  if (!membershipId) throw badRequest("membershipId is required");

  const membership = await Membership.findById(membershipId);
  if (!membership) throw notFound("Membership");
  if (membership.status !== "ACTIVE") throw badRequest("Only an active membership can be assigned to a batch");
  if (membership.batchId && membership.batchId.toString() === batch._id.toString()) {
    throw badRequest("This membership is already assigned to this batch");
  }
  if (membership.endDate < new Date()) throw badRequest("Membership is expired");

  const occupied = await BatchAssignment.countDocuments({ batchId: batch._id, status: "ACTIVE" });
  if (occupied >= batch.maxMembers) throw badRequest("Batch is full");

  if (membership.batchId) {
    await BatchAssignment.updateOne(
      { batchId: membership.batchId, membershipId: membership._id, status: "ACTIVE" },
      { $set: { status: "REMOVED", removedAt: new Date() } },
    );
    await MembershipBatch.findByIdAndUpdate(membership.batchId, { $inc: { currentMembers: -1 } });
  }

  await BatchAssignment.create({
    batchId: batch._id,
    membershipId: membership._id,
    customerId: membership.customerId,
    status: "ACTIVE",
    effectiveFrom: new Date(),
    assignedAt: new Date(),
    reason: req.body.reason || "",
  });

  membership.batchId = batch._id;
  await membership.save();
  await MembershipBatch.findByIdAndUpdate(batch._id, { $inc: { currentMembers: 1 } });

  const customer = await Customer.findById(membership.customerId).select("name mobile");
  res.status(201).json({ success: true, batchId: batch._id, membershipId: membership._id, customer: customer?.name ?? "Unknown" });
}

export async function changeBatch(req, res) {
  const { membershipId, effectiveFrom, reason } = req.body;
  const newBatchId = req.params.id;
  const membership = await Membership.findById(membershipId);
  if (!membership) throw notFound("Membership");
  if (membership.status !== "ACTIVE") throw badRequest("Only an active membership can change batch");
  if (membership.endDate < new Date()) throw badRequest("Membership is expired");

  const fromBatchId = membership.batchId;
  if (fromBatchId && fromBatchId.toString() === newBatchId) throw badRequest("Membership is already in this batch");

  const batch = await MembershipBatch.findById(newBatchId);
  if (!batch) throw notFound("Batch");
  if (batch.status !== "ACTIVE") throw badRequest("Batch is not active");

  const occupied = await BatchAssignment.countDocuments({ batchId: batch._id, status: "ACTIVE" });
  if (occupied >= batch.maxMembers) throw badRequest("Batch is full");

  if (fromBatchId) {
    await BatchAssignment.updateOne(
      { batchId: fromBatchId, membershipId: membership._id, status: "ACTIVE" },
      { $set: { status: "REMOVED", removedAt: new Date() } },
    );
    await MembershipBatch.findByIdAndUpdate(fromBatchId, { $inc: { currentMembers: -1 } });
  }

  await BatchAssignment.create({
    batchId: batch._id,
    membershipId: membership._id,
    customerId: membership.customerId,
    status: "ACTIVE",
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
    assignedAt: new Date(),
    reason: reason || "",
  });

  membership.batchId = batch._id;
  await membership.save();
  await MembershipBatch.findByIdAndUpdate(batch._id, { $inc: { currentMembers: 1 } });

  res.json({ success: true, membershipId: membership._id, batchId: batch._id });
}

export async function activeBatchesForCustomer(req, res) {
  const memberships = await Membership.find({
    customerId: req.params.customerId,
    status: "ACTIVE",
    batchId: { $ne: null },
  }).select("batchId membershipType startDate endDate");

  const items = await Promise.all(memberships.map(async (m) => {
    const batch = await MembershipBatch.findById(m.batchId);
    const plan = m.planId ? await MembershipPlan.findById(m.planId).select("name") : null;
    return {
      membershipId: m._id,
      batchId: m.batchId,
      batchName: batch?.name ?? "Unknown batch",
      days: batch?.days ?? [],
      startTime: batch?.startTime ?? "",
      endTime: batch?.endTime ?? "",
      coach: batch?.coach ?? "",
      level: batch?.level ?? "",
      planName: plan?.name ?? m.membershipType,
      startDate: m.startDate,
      endDate: m.endDate,
      maxMembers: batch?.maxMembers ?? 0,
    };
  }));
  res.json(items);
}
