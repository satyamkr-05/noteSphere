import mongoose from "mongoose";
import { markBackendNotReady, markBackendReady } from "../state/readiness.js";

let hasAttachedConnectionListeners = false;

function attachConnectionListeners() {
  if (hasAttachedConnectionListeners) {
    return;
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
    markBackendReady();
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
    markBackendNotReady(new Error("Database connection lost."));
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
    markBackendNotReady(error);
  });

  hasAttachedConnectionListeners = true;
}

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment variables.");
  }

  if (mongoose.connection.readyState === 1) {
    markBackendReady();
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    markBackendReady();
    return mongoose.connection;
  }

  attachConnectionListeners();
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  markBackendReady();
  return mongoose.connection;
}
