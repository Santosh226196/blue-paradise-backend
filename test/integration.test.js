import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-secret-that-is-long-enough";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "admin123";
process.env.EXPOSE_DEMO_OTP = "true";

const [{ default: app }, { ensureAdminUser }, models] = await Promise.all([
  import("../src/app.js"),
  import("../src/controllers/auth.controller.js"),
  Promise.all([
    import("../src/models/Customer.js"), import("../src/models/Membership.js"),
    import("../src/models/Coaching.js"), import("../src/models/Visit.js"),
    import("../src/models/Attendance.js"), import("../src/models/DuePayment.js"),
  ]),
]);
const [Customer, Membership, Coaching, Visit, Attendance, DuePayment] = models.map((module) => module.default);
const api = request.agent(app);

let mongo;
let customer;
let transaction;

before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1", port: Number(process.env.TEST_MONGO_PORT ?? 27018) } });
  await mongoose.connect(mongo.getUri("blue_paradise_integration"));
  await ensureAdminUser();
  await Attendance.init();
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

test("authentication, OTP verification, reset, and password change flow", async () => {
  const agent = api;
  await agent.post("/api/auth/login").send({ username: "admin", password: "wrong" }).expect(401);
  await agent.post("/api/auth/login").send({ username: { invalid: true }, password: "admin123" }).expect(400);
  await agent.get("/api/customers").expect(401);
  const login = await agent.post("/api/auth/login").send({ username: "admin", password: "admin123" }).expect(200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.username, "admin");
  const forgot = await agent.post("/api/auth/forgot-password").send({ identity: "admin" }).expect(200);
  assert.match(forgot.body.demoOtp, /^\d{6}$/);
  await agent.post("/api/auth/verify-otp").send({ identity: "admin", otp: "000000" }).expect(400);
  const verified = await agent.post("/api/auth/verify-otp").send({ identity: "admin", otp: Number(forgot.body.demoOtp) }).expect(200);
  assert.ok(verified.body.resetToken);
  await agent.post("/api/auth/reset-password").send({ identity: "admin", newPassword: "newpass123", resetToken: "wrong" }).expect(400);
  await agent.post("/api/auth/reset-password").send({ identity: "admin", newPassword: "newpass123" }).expect(200);
  await agent.post("/api/auth/login").send({ username: "admin", password: "newpass123" }).expect(200);
  await agent.post("/api/auth/change-password").send({ currentPassword: "newpass123", newPassword: "admin123" }).expect(200);
  await agent.post("/api/auth/logout").expect(200);
  await agent.post("/api/auth/change-password").send({ currentPassword: "admin123", newPassword: "blocked123" }).expect(401);
  await agent.post("/api/auth/login").send({ username: "admin", password: "admin123" }).expect(200);
});

test("customer CRUD, validation, search, and duplicate handling", async () => {
  const created = await api.post("/api/customers").send({
    name: "Edge Swimmer", mobile: "9000000001", aadhaarNumber: "123456789012", age: 31, gender: "OTHER",
  }).expect(201);
  customer = created.body;
  assert.ok(customer.id);
  assert.equal(customer._id, undefined);
  await api.post("/api/customers").send({ name: "Duplicate", mobile: "9000000001" }).expect(409);
  await api.post("/api/customers").send({ name: "Bad Age", mobile: "9000000002", age: 999 }).expect(400);
  await api.post("/api/customers").send({ name: "Bad Mobile", mobile: "123" }).expect(400);
  const search = await api.get("/api/customers").query({ search: "Edge [Swimmer" }).expect(200);
  assert.equal(search.body.length, 0);
  await api.get("/api/customers").query({ type: "INVALID" }).expect(400);
  const fetched = await api.get(`/api/customers/${customer.id}`).expect(200);
  assert.equal(fetched.body.mobile, "9000000001");
  const updated = await api.put(`/api/customers/${customer.id}`).send({ address: "Pune", id: "cannot-change" }).expect(200);
  assert.equal(updated.body.address, "Pune");
  assert.equal(updated.body.id, customer.id);
  await api.get("/api/customers/not-an-object-id").expect(400);
});

test("membership plan and staff CRUD/filter flows", async () => {
  const plan = await api.post("/api/membership-plans").send({ name: "Test Monthly", duration: "MONTHLY", price: 1000, features: [] }).expect(201);
  await api.put(`/api/membership-plans/${plan.body.id}`).send({ price: 1200 }).expect(200);
  const plans = await api.get("/api/membership-plans").expect(200);
  assert.equal(plans.body[0].price, 1200);
  await api.post("/api/membership-plans").send({ name: "Bad", duration: "FOREVER", price: -1 }).expect(400);

  const staff = await api.post("/api/staff").send({ name: "Coach Edge", mobile: "9000000010", role: "COACH", specialization: "Testing" }).expect(201);
  const filtered = await api.get("/api/staff").query({ search: "Coach", role: "COACH" }).expect(200);
  assert.equal(filtered.body.length, 1);
  await api.get("/api/staff").query({ role: "INVALID" }).expect(400);
  await api.delete(`/api/staff/${staff.body.id}`).expect(200);
  await api.get(`/api/staff/${staff.body.id}`).expect(404);
});

test("billing, bill lookup, dashboard, report ranges, and concurrency", async () => {
  const payload = { customerId: customer.id, serviceType: "MEMBERSHIP", serviceName: "General Membership", amount: 1500, paymentMethod: "CASH" };
  const created = await api.post("/api/billing/transactions").send(payload).expect(201);
  transaction = created.body;
  assert.match(transaction.billNumber, /^BP\d{6}$/);
  await api.post("/api/billing/transactions").send({ ...payload, customerId: new mongoose.Types.ObjectId().toString() }).expect(400);
  await api.post("/api/billing/transactions").send({ ...payload, amount: -10 }).expect(400);

  const concurrent = await Promise.all(Array.from({ length: 5 }, () => api.post("/api/billing/transactions").send(payload)));
  assert.ok(concurrent.every((response) => response.status === 201));
  assert.equal(new Set(concurrent.map((response) => response.body.billNumber)).size, 5);
  await api.get(`/api/billing/transactions/${transaction.id}`).expect(200);
  const today = await api.get("/api/billing/transactions/today").expect(200);
  assert.equal(today.body.length, 6);
  const stats = await api.get("/api/billing/dashboard-stats").expect(200);
  assert.equal(stats.body.totalCustomers, 1);
  assert.equal(stats.body.todayRevenue, 9000);
  for (const period of ["hourly", "daily", "monthly", "yearly"]) {
    const report = await api.get("/api/reports/revenue").query({ period }).expect(200);
    assert.equal(report.body.totalTransactions, 6);
    assert.equal(report.body.totalRevenue, 9000);
    assert.ok(report.body.dailyRevenue.length > 0);
  }
  await api.get("/api/reports/revenue").query({ period: "nonsense" }).expect(400);
  await api.get("/api/reports/revenue").query({ period: "custom" }).expect(400);
  await api.get("/api/reports/revenue").query({ from: "2026-09-01", to: "2026-08-01" }).expect(400);
  await api.get("/api/reports/revenue").query({ from: "2026-02-31" }).expect(400);
});

test("attendance prevents duplicate check-in and duplicate checkout", async () => {
  const checkedIn = await api.post("/api/attendance/check-in").send({ customerId: customer.id, customerName: "Spoofed", visitType: "MEMBERSHIP", lane: 2, checkOutTime: new Date().toISOString() }).expect(201);
  assert.equal(checkedIn.body.customerName, customer.name);
  assert.equal(checkedIn.body.checkOutTime, undefined);
  await api.post("/api/attendance/check-in").send({ customerId: customer.id, customerName: customer.name, visitType: "MEMBERSHIP" }).expect(409);
  const active = await api.get("/api/attendance/active").expect(200);
  assert.equal(active.body.length, 1);
  await api.post(`/api/attendance/${checkedIn.body.id}/check-out`).expect(200);
  await api.post(`/api/attendance/${checkedIn.body.id}/check-out`).expect(409);
  const date = new Date().toISOString().slice(0, 10);
  const day = await api.get(`/api/attendance/${date}`).expect(200);
  assert.equal(day.body.length, 1);
  assert.equal(await Visit.countDocuments({ customerId: customer.id }), 1);
  await api.get("/api/attendance/2026-02-31").expect(400);

  const raceCustomer = await Customer.create({ name: "Race Swimmer", mobile: "9000000099" });
  const concurrent = await Promise.all(Array.from({ length: 3 }, () => api.post("/api/attendance/check-in").send({ customerId: raceCustomer.id, visitType: "WALK_IN" })));
  assert.equal(concurrent.filter((response) => response.status === 201).length, 1);
  assert.equal(concurrent.filter((response) => response.status === 409).length, 2);
  await Attendance.deleteMany({ customerId: raceCustomer.id });
  await Visit.deleteMany({ customerId: raceCustomer.id });
  await raceCustomer.deleteOne();
});

test("due payment lifecycle and summary", async () => {
  const due = await api.post("/api/due-payments").send({ customerId: customer.id, customerName: "Spoofed", customerMobile: "0", description: "Balance", amount: 450, dueDate: "2026-08-01" }).expect(201);
  assert.equal(due.body.customerName, customer.name);
  assert.equal(due.body.status, "OVERDUE");
  const summary = await api.get("/api/due-payments/summary").expect(200);
  assert.deepEqual(summary.body, { totalPending: 0, totalOverdue: 450, count: 1 });
  await api.get("/api/due-payments").query({ status: "INVALID" }).expect(400);
  const paid = await api.post(`/api/due-payments/${due.body.id}/pay`).expect(200);
  assert.equal(paid.body.status, "PAID");
  await api.delete(`/api/due-payments/${due.body.id}`).expect(200);
  await api.get(`/api/due-payments/${due.body.id}`).expect(404);
});

test("settings merge and singleton behavior", async () => {
  const initial = await api.get("/api/settings").expect(200);
  assert.equal(initial.body.billPrefix, "BP");
  const changed = await api.put("/api/settings").send({ businessName: "Updated Club", billPrefix: "xy" }).expect(200);
  assert.equal(changed.body.billPrefix, "XY");
  const again = await api.get("/api/settings").expect(200);
  assert.equal(again.body.businessName, "Updated Club");
  await api.put("/api/settings").send({ singletonKey: "hijack", billPrefix: "not valid!" }).expect(400);
  await api.put("/api/settings").send({ clubTiming: { openTime: "25:00", closeTime: "02:00" } }).expect(400);
});

test("schedule and announcement active/expiry flows", async () => {
  const slot = await api.post("/api/schedule").send({ day: "Monday", startTime: "06:00", endTime: "07:00", type: "LANE", label: "Test lane", maxCapacity: 8 }).expect(201);
  await api.put(`/api/schedule/${slot.body.id}`).send({ currentBookings: 2 }).expect(200);
  const schedule = await api.get("/api/schedule").query({ day: "Monday" }).expect(200);
  assert.equal(schedule.body.length, 1);
  await api.get("/api/schedule").query({ day: "Funday" }).expect(400);
  await api.post("/api/schedule").send({ day: "Monday", startTime: "25:00", endTime: "26:00", type: "LANE", label: "Bad", maxCapacity: 8 }).expect(400);
  await api.post("/api/schedule").send({ day: "Monday", startTime: "08:00", endTime: "07:00", type: "LANE", label: "Backwards", maxCapacity: 8 }).expect(400);
  await api.put(`/api/schedule/${slot.body.id}`).send({ currentBookings: 20 }).expect(400);
  await api.post("/api/schedule").send({ day: "Monday", startTime: "09:00", endTime: "10:00", type: "COACHING", label: "Missing coach", coachId: new mongoose.Types.ObjectId(), maxCapacity: 8 }).expect(400);

  const active = await api.post("/api/announcements").send({ title: "Active", message: "Shown", priority: "HIGH", isActive: true }).expect(201);
  await api.post("/api/announcements").send({ title: "Expired", message: "Hidden", isActive: true, expiresAt: "2020-01-01" }).expect(201);
  const announcements = await api.get("/api/announcements/active").expect(200);
  assert.deepEqual(announcements.body.map((item) => item.id), [active.body.id]);
});

test("customer profile histories and deletion cleanup", async () => {
  const now = new Date();
  const later = new Date(now); later.setMonth(later.getMonth() + 1);
  await Membership.create({ customerId: customer.id, membershipType: "MONTHLY", startDate: now, endDate: later, amount: 1500 });
  await Coaching.create({ customerId: customer.id, coachingType: "BEGINNER", startDate: now, endDate: later, amount: 2000 });
  await DuePayment.create({ customerId: customer.id, customerName: customer.name, customerMobile: customer.mobile, description: "Outstanding", amount: 100, dueDate: later });
  assert.equal((await api.get(`/api/customers/${customer.id}/memberships`).expect(200)).body.length, 1);
  assert.equal((await api.get(`/api/customers/${customer.id}/coaching`).expect(200)).body.length, 1);
  assert.equal((await api.get(`/api/customers/${customer.id}/transactions`).expect(200)).body.length, 6);
  await api.delete(`/api/customers/${customer.id}`).expect(200);
  await api.get(`/api/customers/${customer.id}`).expect(404);
  assert.equal(await Membership.countDocuments({ customerId: customer.id }), 0);
  assert.equal(await Coaching.countDocuments({ customerId: customer.id }), 0);
  assert.equal(await Attendance.countDocuments({ customerId: customer.id }), 0);
  assert.equal(await DuePayment.countDocuments({ customerId: customer.id }), 0);
});
