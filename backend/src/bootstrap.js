import { connectDB } from "./config/db.js";
import { syncAdminUser } from "./utils/syncAdminUser.js";

let backendReadyPromise;

export function ensureBackendReady() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      await connectDB();
      await syncAdminUser();
    })().catch((error) => {
      backendReadyPromise = undefined;
      throw error;
    });
  }

  return backendReadyPromise;
}
