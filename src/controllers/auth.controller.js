import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { authCookieOptions, getCookie } from "../utils/cookies.js";

const hash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const identityQuery = (identity) => {
  const normalized = identity.trim().toLowerCase();
  return { $or: [{ username: normalized }, { email: normalized }, { mobile: identity.trim() }] };
};
const publicUser = (user) => ({ username: user.username });

export async function login(req, res) {
  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  const user = await User.findOne(identityQuery(username)).select("+passwordHash");
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, username: user.username }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie("bp_auth_token", token, { ...authCookieOptions(env.nodeEnv === "production"), maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ token, user: publicUser(user) });
}

export function logout(_req, res) {
  res.clearCookie("bp_auth_token", authCookieOptions(env.nodeEnv === "production"));
  res.json({ success: true });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ message: "Current password and a new password of at least 6 characters are required" });
  }
  const username = req.user?.username ?? env.adminUsername;
  const user = await User.findOne({ username: username.toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.verifyPassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  await user.setPassword(newPassword);
  await user.save();
  res.json({ success: true });
}

export async function forgotPassword(req, res) {
  const { identity } = req.body;
  if (typeof identity !== "string" || !identity.trim()) return res.status(400).json({ message: "Please enter your username, mobile, or email" });
  const user = await User.findOne(identityQuery(identity));
  // Return the same shape for unknown users to avoid exposing registered identities.
  const otp = String(crypto.randomInt(100000, 1000000));
  if (user) {
    user.resetOtpHash = hash(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
  }
  if (env.nodeEnv === "development") console.log(`Password reset OTP for ${identity}: ${otp}`);
  const response = {
    success: true,
    message: "Verification code sent to registered contact",
    maskedDestination: user?.email ? user.email.replace(/(^.).*(@.*$)/, "$1***$2") : "registered contact",
  };
  if (env.exposeDemoOtp && user) response.demoOtp = otp;
  res.json(response);
}

export async function verifyOtp(req, res) {
  const { identity, otp } = req.body;
  const normalizedOtp = String(otp ?? "");
  const user = typeof identity === "string" && identity.trim() ? await User.findOne(identityQuery(identity)).select("+resetOtpHash +resetOtpExpiresAt") : null;
  if (!user || !/^\d{6}$/.test(normalizedOtp) || user.resetOtpHash !== hash(normalizedOtp) || user.resetOtpExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP code" });
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = hash(resetToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.resetOtpHash = undefined;
  user.resetOtpExpiresAt = undefined;
  await user.save();
  res.cookie("bp_reset_token", resetToken, { ...authCookieOptions(env.nodeEnv === "production"), maxAge: 15 * 60 * 1000 });
  res.json({ success: true, resetToken });
}

export async function resetPassword(req, res) {
  const { identity, newPassword, resetToken } = req.body;
  if (typeof identity !== "string" || !identity.trim() || typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ message: "Identity and a new password of at least 6 characters are required" });
  }
  const presentedToken = resetToken || getCookie(req, "bp_reset_token");
  const user = await User.findOne(identityQuery(identity)).select("+resetTokenHash +resetTokenExpiresAt +passwordHash");
  const tokenMatches = user && presentedToken && user.resetTokenHash === hash(presentedToken);
  if (!tokenMatches || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: "Password reset session is invalid or expired" });
  }
  await user.setPassword(newPassword);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  res.clearCookie("bp_reset_token", authCookieOptions(env.nodeEnv === "production"));
  res.json({ success: true, message: "Password updated successfully" });
}

export async function ensureAdminUser() {
  const username = env.adminUsername.toLowerCase();
  if (await User.exists({ username })) return;
  const user = new User({ username, email: env.adminEmail, mobile: env.adminMobile, passwordHash: "temporary" });
  await user.setPassword(env.adminPassword);
  await user.save();
  if (env.nodeEnv !== "test") console.log(`Created initial admin user: ${username}`);
}
