import app from "../backend/src/app.js";
import { ensureBackendReady } from "../backend/src/bootstrap.js";

function getStartupErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("MONGODB_URI is not set")) {
    return "Server configuration is incomplete. Set MONGODB_URI in the environment variables.";
  }

  if (message.includes("JWT_SECRET is not set") || message.includes("secretOrPrivateKey must have a value")) {
    return "Server configuration is incomplete. Set JWT_SECRET in the environment variables.";
  }

  if (message.includes("ADMIN_EMAIL")) {
    return "Server configuration is incomplete. Set ADMIN_EMAIL in the environment variables.";
  }

  return "The server could not start correctly. Please try again.";
}

export default async function handler(req, res) {
  try {
    await ensureBackendReady();
    return app(req, res);
  } catch (error) {
    console.error("Failed to initialize API handler:", error);
    const responseBody = JSON.stringify({
      success: false,
      message: getStartupErrorMessage(error),
      details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
    });

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(responseBody);
  }
}
