import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const identityQuery = (identity) => {
  const normalized = identity.trim().toLowerCase();
  return { $or: [{ username: normalized }, { email: normalized }, { mobile: identity.trim() }] };
};
const publicUser = (user) => ({ username: user.username });

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password are required" });
  const user = await User.findOne(identityQuery(username)).select("+passwordHash");
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, username: user.username }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.json({ token, user: publicUser(user) });
}

export function logout(_req, res) {
  res.json({ success: true });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
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
  if (!identity?.trim()) return res.status(400).json({ message: "Please enter your username, mobile, or email" });
  const user = await User.findOne(identityQuery(identity));
  // Return the same shape for unknown users to avoid exposing registered identities.
  const otp = String(crypto.randomInt(100000, 1000000));
  if (user) {
    user.resetOtpHash = hash(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
  }
  if (env.nodeEnv !== "production") console.log(`Password reset OTP for ${identity}: ${otp}`);
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
  const user = identity ? await User.findOne(identityQuery(identity)).select("+resetOtpHash +resetOtpExpiresAt") : null;
  if (!user || !otp || user.resetOtpHash !== hash(otp) || user.resetOtpExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP code" });
  }
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = hash(resetToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.resetOtpHash = undefined;
  user.resetOtpExpiresAt = undefined;
  await user.save();
  res.json({ success: true, resetToken });
}

export async function resetPassword(req, res) {
  const { identity, newPassword, resetToken } = req.body;
  if (!identity || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Identity and a new password of at least 6 characters are required" });
  }
  const user = await User.findOne(identityQuery(identity)).select("+resetTokenHash +resetTokenExpiresAt +passwordHash");
  const tokenMatches = user && (!resetToken || user.resetTokenHash === hash(resetToken));
  if (!tokenMatches || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: "Password reset session is invalid or expired" });
  }
  await user.setPassword(newPassword);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  res.json({ success: true, message: "Password updated successfully" });
}

export async function ensureAdminUser() {
  const username = env.adminUsername.toLowerCase();
  if (await User.exists({ username })) return;
  const user = new User({ username, email: env.adminEmail, mobile: env.adminMobile, passwordHash: "temporary" });
  await user.setPassword(env.adminPassword);
  await user.save();
  console.log(`Created initial admin user: ${username}`);
}
