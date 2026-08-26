import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCookie } from "../utils/cookies.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : getCookie(req, "bp_auth_token");
  if (!token) return next(Object.assign(new Error("Authentication required"), { statusCode: 401 }));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(payload.sub).select("-passwordHash");
    if (!req.user) throw new Error("User not found");
    next();
  } catch {
    next(Object.assign(new Error("Invalid or expired token"), { statusCode: 401 }));
  }
});
