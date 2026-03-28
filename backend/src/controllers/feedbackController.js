import Feedback from "../models/Feedback.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFeedback = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const type = typeof req.body.type === "string" ? req.body.type.trim().toLowerCase() : "feedback";
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!name || name.length < 2) {
    res.status(400);
    throw new Error("Please enter your name.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  if (!["query", "feedback", "bug", "feature"].includes(type)) {
    res.status(400);
    throw new Error("Please choose a valid feedback type.");
  }

  if (!message || message.length < 10) {
    res.status(400);
    throw new Error("Please enter at least 10 characters in your message.");
  }

  const entry = await Feedback.create({
    name,
    email,
    type,
    message,
    submittedBy: req.user?._id || null
  });

  res.status(201).json({
    message: "Your message has been sent successfully.",
    feedback: {
      id: entry._id.toString(),
      name: entry.name,
      email: entry.email,
      type: entry.type,
      message: entry.message,
      status: entry.status,
      createdAt: entry.createdAt
    }
  });
});
