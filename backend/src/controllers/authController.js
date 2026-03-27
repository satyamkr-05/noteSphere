import User from "../models/User.js";
import { isAdminEmail } from "../config/runtime.js";
import { createToken } from "../utils/createToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function normalizeName(value = "") {
  return value.trim();
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminEmail(user.email)
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
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required.");
  }

  if (isAdminEmail(normalizedEmail)) {
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
  const normalizedEmail = normalizeEmail(email);

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
