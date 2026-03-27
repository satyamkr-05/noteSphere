import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../config/env.js";
import { getAdminEmail, isAdminEmail } from "../config/runtime.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authorized. Please log in.", 401);
  }

  const token = authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET is not set")) {
      throw new AppError("Server configuration is incomplete. Set JWT_SECRET in the environment variables.", 500);
    }

    throw new AppError("Invalid or expired token.", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User not found for this token.", 401);
  }

  if (user.passwordChangedAt) {
    const passwordChangedAtSeconds = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);

    if (decoded.iat && decoded.iat < passwordChangedAtSeconds) {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
  }

  user.isAdmin = isAdminEmail(user.email);
  req.user = user;
  next();
});

export function adminOnly(req, _res, next) {
  if (!getAdminEmail()) {
    throw new AppError("Admin access is not configured. Set ADMIN_EMAIL in the environment variables.", 500);
  }

  if (!req.user?.isAdmin) {
    throw new AppError("Admin access only.", 403);
  }

  next();
}
