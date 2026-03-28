import { connectDB } from "./config/db.js";
import { syncAdminUser } from "./utils/syncAdminUser.js";
import { syncUserRoles } from "./utils/syncUserRoles.js";

let backendReadyPromise;

export function ensureBackendReady() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      await connectDB();
      await syncUserRoles();
      await syncAdminUser();
    })().catch((error) => {
      backendReadyPromise = undefined;
      throw error;
    });
  }

  return backendReadyPromise;
}
