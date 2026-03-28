import { isAdminEmail } from "../config/runtime.js";

export function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminEmail(user.email),
    avatarUrl: user.avatarPath || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
