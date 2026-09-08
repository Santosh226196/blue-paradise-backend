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
import PoolService from "./models/PoolService.js";
import Costume from "./models/Costume.js";
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
    { name: "Day Pass", description: "Single day pool access", duration: "DAILY", price: 300, features: ["Pool access", "Towel service"] },
    { name: "Weekend Pass", description: "Saturday & Sunday pool access", duration: "WEEKEND", price: 500, features: ["Pool access", "Locker", "Towel service"] },
    { name: "Basic Monthly", description: "Standard monthly pool access", duration: "MONTHLY", price: 1500, features: ["Pool access", "Locker"] },
    { name: "3-Month Plan", description: "Three months pool access", duration: "THREE_MONTHS", price: 4000, features: ["Pool access", "Locker", "Towel service"] },
    { name: "6-Month Plan", description: "Six months pool access", duration: "SIX_MONTHS", price: 7000, features: ["Pool access", "Private locker", "Towel service"] },
    { name: "Annual Premium", description: "Full year unlimited access", duration: "YEARLY", price: 12000, features: ["Unlimited pool access", "Private locker", "Guest passes"] },
    { name: "Family Plan", description: "Monthly access for entire family", duration: "FAMILY", price: 3500, features: ["Pool access for 4", "Family locker", "Guest passes"] },
    { name: "Student Plan", description: "Discounted monthly access for students", duration: "STUDENT", price: 1000, features: ["Pool access", "Locker", "Valid student ID required"] },
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
  if (await PoolService.countDocuments() === 0) await PoolService.insertMany([
    { name: "Filter Service", category: "Equipment", frequencyDays: 7, status: "upcoming" },
    { name: "Tank Cleaning", category: "Cleaning", frequencyDays: 14, status: "overdue" },
    { name: "Water Cleaning", category: "Cleaning", frequencyDays: 7, status: "upcoming" },
    { name: "Chlorine Check", category: "Chemical", frequencyDays: 3, status: "upcoming" },
    { name: "pH Level Testing", category: "Chemical", frequencyDays: 3, status: "completed" },
  ]);
  if (await Costume.countDocuments() === 0) await Costume.insertMany([
    {
      name: "Classic Swim Trunks", type: "MENS", price: 699, rentPrice: 150,
      variants: [
        { size: "M", color: "Navy", stock: 12 },
        { size: "L", color: "Navy", stock: 10 },
        { size: "M", color: "Black", stock: 8 },
        { size: "L", color: "Black", stock: 20 },
      ],
    },
    {
      name: "Pro Racing Swimsuit", type: "MENS", price: 999, rentPrice: 200,
      variants: [
        { size: "L", color: "Black", stock: 8 },
        { size: "XL", color: "Black", stock: 5 },
        { size: "L", color: "Blue", stock: 30 },
      ],
    },
    {
      name: "Comfort Fit Bikini", type: "WOMENS", price: 849, rentPrice: 180,
      variants: [
        { size: "S", color: "Teal", stock: 15 },
        { size: "M", color: "Teal", stock: 18 },
        { size: "M", color: "Pink", stock: 24 },
      ],
    },
    {
      name: "One-Piece Aqua Suit", type: "WOMENS", price: 1199, rentPrice: 250,
      variants: [
        { size: "M", color: "Coral", stock: 10 },
        { size: "L", color: "Coral", stock: 14 },
      ],
    },
    {
      name: "Kids Splash Trunks", type: "KIDS", price: 499, rentPrice: 100,
      variants: [
        { size: "8Y", color: "Blue", stock: 25 },
        { size: "10Y", color: "Blue", stock: 20 },
        { size: "12Y", color: "Green", stock: 18 },
      ],
    },
    {
      name: "Family Swim Pack", type: "UNISEX", price: 2499, rentPrice: 500,
      variants: [
        { size: "Free", color: "Multi", stock: 5 },
      ],
    },
  ]);
  console.log("Seed complete. Existing collections were preserved.");
}

seed().catch((error) => { console.error("Seed failed", error); process.exitCode = 1; }).finally(disconnectDatabase);
