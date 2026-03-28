import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { getAllowedOrigins } from "./config/runtime.js";
import { avatarDir } from "./config/runtime.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { getReadinessState, isBackendReady } from "./state/readiness.js";

dotenv.config();

const app = express();
const allowedOrigins = getAllowedOrigins();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const distDir = path.resolve(currentDirPath, "..", "..", "dist");
const distIndexPath = path.join(distDir, "index.html");
const hasFrontendBuild = fs.existsSync(distIndexPath);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/media/avatars", express.static(avatarDir));

app.get("/api/health", (_req, res) => {
  const readiness = getReadinessState();

  res.json({
    status: readiness.isReady ? "ok" : readiness.isInitializing ? "starting" : "degraded",
    readiness
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    next();
    return;
  }

  if (!isBackendReady()) {
    res.status(503).json({
      success: false,
      message: "The service is starting up. Please try again in a moment."
    });
    return;
  }

  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

app.use("/api", notFound);

if (hasFrontendBuild) {
  app.use(express.static(distDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || path.extname(req.path)) {
      next();
      return;
    }

    res.sendFile(distIndexPath);
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

export default app;
