import { z } from "zod";
import { AADHAAR_PATTERN, EMAIL_PATTERN, PHONE_PATTERN, normalizeAadhaar, normalizeEmail, normalizePhone, isImageValue } from "../utils/normalizers.js";
import { DAYS, PAYMENT_METHODS, SERVICE_TYPES, VISIT_TYPES } from "../models/constants.js";

const trimmed = (min, max, label) => z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);
const optionalTrimmed = (max) => z.string().trim().max(max).optional();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID");
const image = z.string().max(8_000_000, "Image must be smaller than 8 MB").refine(isImageValue, "Must be an HTTP image URL or supported image data").optional();
const phone = z.union([z.string(), z.number().int()]).transform(normalizePhone).refine((value) => PHONE_PATTERN.test(value ?? ""), "Enter a valid Indian 10-digit mobile number");
const aadhaar = z.string().transform(normalizeAadhaar).refine((value) => AADHAAR_PATTERN.test(value ?? ""), "Enter a valid 12-digit Aadhaar number").optional();
const email = z.string().transform(normalizeEmail).refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address");
const amount = z.number().finite().positive("Amount must be greater than zero").max(10_000_000, "Amount is too large");
const dateString = z.string().refine((value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}, "Enter a valid date");
const strictPartial = (schema) => schema.partial().strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

const identity = z.string().trim().min(1).max(254).superRefine((value, ctx) => {
  if (value.includes("@") && !EMAIL_PATTERN.test(value)) ctx.addIssue({ code: "custom", message: "Enter a valid email address" });
  const phoneValue = normalizePhone(value);
  if (/^[+\d\s()-]+$/.test(value) && !PHONE_PATTERN.test(phoneValue ?? "")) ctx.addIssue({ code: "custom", message: "Enter a valid mobile number" });
});

export const loginSchema = z.object({ username: identity, password: z.string().min(1).max(128) }).strict();
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/, "Password must contain a letter").regex(/\d/, "Password must contain a number") }).strict();
export const forgotPasswordSchema = z.object({ identity }).strict();
export const verifyOtpSchema = z.object({ identity, otp: z.union([z.string(), z.number().int()]).transform(String).refine((value) => /^\d{6}$/.test(value), "OTP must contain 6 digits") }).strict();
export const resetPasswordSchema = z.object({ identity, newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/), resetToken: z.string().length(64).optional() }).strict();

const customerFields = {
  name: trimmed(2, 100, "Name"), mobile: phone, email: email.optional(), aadhaarNumber: aadhaar,
  age: z.number().int().min(1).max(120).optional(), gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: optionalTrimmed(500), photoUrl: image, idCardPhoto: image,
};
export const createCustomerSchema = z.object(customerFields).strict();
export const updateCustomerSchema = strictPartial(z.object(customerFields));

export const transactionSchema = z.object({
  customerId: objectId, serviceType: z.enum(SERVICE_TYPES), serviceName: trimmed(2, 100, "Service name"),
  amount, paymentMethod: z.enum(PAYMENT_METHODS),
}).strict();

export const checkInSchema = z.object({ customerId: objectId, customerName: z.string().optional(), visitType: z.enum(VISIT_TYPES), lane: z.number().int().min(1).max(10).optional(), photoUrl: image }).strict();

const planFields = { name: trimmed(2, 100, "Plan name"), description: z.string().trim().max(1000).default(""), duration: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]), price: amount, features: z.array(trimmed(1, 100, "Feature")).max(30), isActive: z.boolean() };
export const createPlanSchema = z.object(planFields).strict();
export const updatePlanSchema = strictPartial(z.object(planFields));

const staffFields = { name: trimmed(2, 100, "Name"), mobile: phone, email: email.optional(), role: z.enum(["COACH", "LIFEGUARD", "RECEPTIONIST", "MANAGER"]), specialization: optionalTrimmed(200), isAvailable: z.boolean(), photoUrl: image };
export const createStaffSchema = z.object(staffFields).strict();
export const updateStaffSchema = strictPartial(z.object(staffFields));

const dueFields = { customerId: objectId, customerName: z.string().max(100).optional(), customerMobile: z.string().optional(), description: trimmed(2, 500, "Description"), amount, dueDate: dateString, status: z.enum(["PENDING", "OVERDUE", "PAID"]).optional() };
export const createDueSchema = z.object(dueFields).strict();

const scheduleFields = { day: z.enum(DAYS), startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), type: z.enum(["LANE", "COACHING", "OPEN_SWIM"]), label: trimmed(2, 100, "Label"), lane: z.number().int().min(1).max(10).optional(), coachId: objectId.optional(), maxCapacity: z.number().int().min(1).max(500), currentBookings: z.number().int().min(0).max(500).optional() };
export const createScheduleSchema = z.object(scheduleFields).strict();
export const updateScheduleSchema = strictPartial(z.object(scheduleFields));

const announcementFields = { title: trimmed(2, 150, "Title"), message: trimmed(2, 5000, "Message"), priority: z.enum(["LOW", "MEDIUM", "HIGH"]), isActive: z.boolean(), expiresAt: dateString.optional() };
export const createAnnouncementSchema = z.object(announcementFields).strict();
export const updateAnnouncementSchema = strictPartial(z.object(announcementFields));

const timing = z.object({ openTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), closeTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), daysOpen: z.array(z.enum(DAYS)).min(1), holidaysEnabled: z.boolean() }).strict();
export const updateSettingsSchema = strictPartial(z.object({ businessName: trimmed(2, 150, "Business name"), logo: image, printerSettings: z.object({ connected: z.boolean(), model: optionalTrimmed(100) }).strict(), billPrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,8}$/), billFooter: z.string().trim().max(1000), clubTiming: timing }));
