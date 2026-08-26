import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { ensureAdminUser } from "./controllers/auth.controller.js";
import Customer from "./models/Customer.js";
import Membership from "./models/Membership.js";
import Coaching from "./models/Coaching.js";
import Visit from "./models/Visit.js";
import Transaction from "./models/Transaction.js";
import Counter from "./models/Counter.js";
import MembershipPlan from "./models/MembershipPlan.js";
import Staff from "./models/Staff.js";
import ScheduleSlot from "./models/ScheduleSlot.js";
import Announcement from "./models/Announcement.js";
import DuePayment from "./models/DuePayment.js";
import BusinessSettings from "./models/BusinessSettings.js";
import { DAYS } from "./models/constants.js";

async function seed() {
  await connectDatabase();
  await ensureAdminUser();
  await BusinessSettings.findOneAndUpdate({ singletonKey: "default" }, { $setOnInsert: {
    singletonKey: "default", businessName: "Blue Paradise Water Club", billPrefix: "BP",
    billFooter: "Thank you for visiting Blue Paradise!", printerSettings: { connected: false },
    clubTiming: { openTime: "05:00", closeTime: "22:00", daysOpen: DAYS, holidaysEnabled: false },
  } }, { upsert: true });

  if (await MembershipPlan.countDocuments() === 0) await MembershipPlan.insertMany([
    { name: "Basic Monthly", description: "Standard monthly pool access", duration: "MONTHLY", price: 1500, features: ["Pool access", "Locker"] },
    { name: "Quarterly Plus", description: "Three months with coaching discount", duration: "QUARTERLY", price: 4000, features: ["Pool access", "Locker", "Towel service"] },
    { name: "Annual Premium", description: "Full year unlimited access", duration: "YEARLY", price: 12000, features: ["Unlimited pool access", "Private locker", "Guest passes"] },
  ]);

  let staff = await Staff.find();
  if (staff.length === 0) staff = await Staff.insertMany([
    { name: "Coach Rajesh", mobile: "9876543220", role: "COACH", specialization: "Freestyle & Backstroke" },
    { name: "Meena Rao", mobile: "9876543221", role: "COACH", specialization: "Butterfly & Breaststroke" },
    { name: "Vikram Singh", mobile: "9876543222", role: "LIFEGUARD" },
  ]);

  let customers = await Customer.find();
  if (customers.length === 0) customers = await Customer.insertMany([
    { name: "Rahul Sharma", mobile: "9876543210", age: 28, gender: "MALE", address: "Pune" },
    { name: "Priya Patel", mobile: "9876543211", age: 25, gender: "FEMALE", address: "Pune" },
    { name: "Amit Kumar", mobile: "9876543212", age: 34, gender: "MALE", address: "Mumbai" },
  ]);

  const now = new Date();
  const monthLater = new Date(now); monthLater.setMonth(monthLater.getMonth() + 1);
  const quarterLater = new Date(now); quarterLater.setMonth(quarterLater.getMonth() + 3);
  if (await Membership.countDocuments() === 0) await Membership.create({ customerId: customers[0]._id, membershipType: "MONTHLY", startDate: now, endDate: monthLater, amount: 1500 });
  if (await Coaching.countDocuments() === 0) await Coaching.create({ customerId: customers[1]._id, coachingType: "BEGINNER", startDate: now, endDate: quarterLater, amount: 2000 });
  if (await Visit.countDocuments() === 0) await Visit.insertMany([
    { customerId: customers[0]._id, visitType: "MEMBERSHIP", visitedAt: now },
    { customerId: customers[1]._id, visitType: "COACHING", visitedAt: now },
  ]);
  if (await Transaction.countDocuments() === 0) {
    await Transaction.insertMany([
      { billNumber: "BP000001", customerId: customers[0]._id, serviceType: "MEMBERSHIP", serviceName: "General Membership", amount: 1500, paymentMethod: "CASH", paidAt: now },
      { billNumber: "BP000002", customerId: customers[1]._id, serviceType: "COACHING", serviceName: "Coaching", amount: 2000, paymentMethod: "UPI", paidAt: now },
    ]);
    await Counter.findByIdAndUpdate("bill", { value: 2 }, { upsert: true });
  }
  if (await DuePayment.countDocuments() === 0) {
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    await DuePayment.create({ customerId: customers[2]._id, customerName: customers[2].name, customerMobile: customers[2].mobile, description: "Monthly membership fee", amount: 1500, dueDate: yesterday, status: "OVERDUE" });
  }
  if (await ScheduleSlot.countDocuments() === 0) await ScheduleSlot.insertMany([
    { day: "Monday", startTime: "06:00", endTime: "07:30", type: "LANE", label: "Morning Lap Swim", lane: 1, maxCapacity: 8 },
    { day: "Monday", startTime: "08:00", endTime: "09:00", type: "COACHING", label: "Beginner Coaching", coachId: staff[0]._id, maxCapacity: 6 },
    { day: "Saturday", startTime: "11:30", endTime: "13:00", type: "OPEN_SWIM", label: "Family Swim", maxCapacity: 30 },
  ]);
  if (await Announcement.countDocuments() === 0) await Announcement.create({ title: "Welcome to Blue Paradise", message: "Pool schedules and notices are now available in the app.", priority: "MEDIUM", isActive: true });
  console.log("Seed complete. Existing collections were preserved.");
}

seed().catch((error) => { console.error("Seed failed", error); process.exitCode = 1; }).finally(disconnectDatabase);
