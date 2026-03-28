import User from "../models/User.js";
import { ADMIN_ROLES } from "../config/runtime.js";

export async function syncUserRoles() {
  await User.updateMany(
    { adminRole: { $exists: false } },
    { $set: { adminRole: ADMIN_ROLES.USER } }
  );
}
