import dotenv from "dotenv";
import app from "./app.js";
import { ensureBackendReady } from "./bootstrap.js";
import { getStorageConfig } from "./config/runtime.js";
import { syncNoteHashes } from "./utils/syncNoteHashes.js";
import {
  getReadinessState,
  markBackendInitializing,
  markBackendNotReady,
  markBackendReady
} from "./state/readiness.js";

dotenv.config();

const port = process.env.PORT || 5000;
const STARTUP_RETRY_DELAY_MS = 15000;
let server;
let startupRetryTimer;

function shutdownServer(exitCode = 0) {
  if (startupRetryTimer) {
    clearTimeout(startupRetryTimer);
    startupRetryTimer = undefined;
  }

  if (server) {
    server.close(() => process.exit(exitCode));
    return;
  }

  process.exit(exitCode);
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  shutdownServer(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  shutdownServer(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing server gracefully...");
  shutdownServer(0);
});

async function startServer() {
  const storageConfig = getStorageConfig();

  if (storageConfig.isEphemeral) {
    console.warn(
      "Uploads are using ephemeral /tmp storage. Set UPLOAD_DIR to a persistent directory before production use."
    );
  }

  console.log(`Upload directory: ${storageConfig.uploadDir}`);
  server = app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });

  bootstrapBackend();
}

async function bootstrapBackend() {
  if (getReadinessState().isInitializing) {
    return;
  }

  try {
    markBackendInitializing();
    await ensureBackendReady();
    markBackendReady();
    console.log("Backend warm-up complete");
    syncNoteHashes().catch((error) => {
      console.warn(`Background note hash sync failed: ${error.message}`);
    });
  } catch (error) {
    markBackendNotReady(error);
    console.error(`Backend warm-up failed: ${error.message}`);
    console.log(`Retrying backend warm-up in ${Math.round(STARTUP_RETRY_DELAY_MS / 1000)} seconds...`);
    startupRetryTimer = setTimeout(() => {
      startupRetryTimer = undefined;
      bootstrapBackend();
    }, STARTUP_RETRY_DELAY_MS);
  }
}

startServer().catch((error) => {
  console.error("Failed to start backend server:", error.message);
  process.exit(1);
});
