export const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
export const PHONE_PATTERN = /^[6-9]\d{9}$/;
export const AADHAAR_PATTERN = /^[2-9]\d{11}$/;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export function normalizePhone(value) {
  if (value === undefined || value === null || value === "") return undefined;
  let normalized = String(value).trim().replace(/[\s()-]/g, "");
  if (normalized.startsWith("+91")) normalized = normalized.slice(3);
  else if (normalized.startsWith("91") && normalized.length === 12) normalized = normalized.slice(2);
  return normalized;
}

export function normalizeAadhaar(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value).replace(/[\s-]/g, "");
}

export function isImageValue(value) {
  if (!value) return true;
  return /^https?:\/\/[^\s]+$/i.test(value) || /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value);
}
