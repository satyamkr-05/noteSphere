import dotenv from "dotenv";
import app from "./app.js";
import { ensureBackendReady } from "./bootstrap.js";
import { getStorageConfig } from "./config/runtime.js";
import { syncNoteHashes } from "./utils/syncNoteHashes.js";

dotenv.config();

const port = process.env.PORT || 5000;
let server;

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);

  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
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
