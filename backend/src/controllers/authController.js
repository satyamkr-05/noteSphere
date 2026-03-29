import crypto from "crypto";
import User from "../models/User.js";
import { getPrimaryClientUrl, isMainAdminEmail } from "../config/runtime.js";
import { createToken } from "../utils/createToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isMailConfigured, sendPasswordResetEmail } from "../utils/sendEmail.js";
import { serializeUser } from "../utils/serializeUser.js";

function normalizeName(value = "") {
  return value.trim();
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function normalizePassword(value = "") {
  return typeof value === "string" ? value : "";
}

function validateEmail(res, value) {
  const normalizedEmail = normalizeEmail(value);

  if (!normalizedEmail) {
    res.status(400);
    throw new Error("Email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  return normalizedEmail;
}

function getPasswordResetWindowMs() {
  const configuredMinutes = Number(process.env.RESET_PASSWORD_TTL_MINUTES || 30);
  const safeMinutes = Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : 30;

  return safeMinutes * 60 * 1000;
}

function createPasswordResetState() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    hashedToken,
    expiresAt: new Date(Date.now() + getPasswordResetWindowMs())
  };
}

function buildAuthResponse(user) {
  return {
    token: createToken(user._id),
    user: serializeUser(user)
  };
}

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedName = normalizeName(name);
  const normalizedEmail = validateEmail(res, email);

  if (!normalizedName || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required.");
  }

  if (isMainAdminEmail(normalizedEmail)) {
    res.status(403);
    throw new Error("This email is reserved for admin access.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with that email already exists.");
  }

  const user = await User.create({ name: normalizedName, email: normalizedEmail, password });

  res.status(201).json(buildAuthResponse(user));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = validateEmail(res, email);

  if (!normalizedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  res.json(buildAuthResponse(user));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: serializeUser(req.user)
  });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const normalizedEmail = validateEmail(res, req.body.email);

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordResetToken +passwordResetExpiresAt"
  );
  const successMessage =
    "If your email is registered, a reset link will arrive shortly.";

  if (!user) {
    res.json({ message: successMessage });
    return;
  }

  const { rawToken, hashedToken, expiresAt } = createPasswordResetState();
  const resetUrl = `${getPrimaryClientUrl()}/reset-password/${rawToken}`;

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiresAt = expiresAt;
  await user.save();

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      res.status(503);
      throw new Error("Password reset email is not configured yet. Add your email provider settings to the environment variables.");
    }

    res.json({
      message: "Email is not configured locally yet. Use the reset link below for testing.",
      resetUrl
    });
    return;
  }

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      expiresAt
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    res.status(503);
    throw new Error("We couldn't send the password reset email right now. Please try again in a moment.");
  }

  res.json({ message: successMessage });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const password = normalizePassword(req.body.password);
  const confirmPassword = normalizePassword(req.body.confirmPassword);

  if (!password || !confirmPassword) {
    res.status(400);
    throw new Error("Password and confirm password are required.");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long.");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match.");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token || "").digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select("+password +passwordResetToken +passwordResetExpiresAt");

  if (!user) {
    res.status(400);
    throw new Error("This password reset link is invalid or has expired.");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  res.json({
    message: "Password reset successful. You can now log in with your new password."
  });
});

export const validateResetToken = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token || "").digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select("_id");

  if (!user) {
    res.status(400);
    throw new Error("This password reset link is invalid or has expired.");
  }

  res.json({ valid: true });
});
