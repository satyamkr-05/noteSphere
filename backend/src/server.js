import dotenv from "dotenv";
import app from "./app.js";
import { ensureBackendReady } from "./bootstrap.js";
import { getStorageConfig } from "./config/runtime.js";
import { syncNoteHashes } from "./utils/syncNoteHashes.js";

dotenv.config();

const port = process.env.PORT || 5000;
let server;

function shutdownServer(exitCode = 0) {
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
  await ensureBackendReady();
  await syncNoteHashes();
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
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
