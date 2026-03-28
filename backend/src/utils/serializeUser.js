import { getResolvedAdminRole, isAdminUser, isMainAdminUser } from "../config/runtime.js";

export function serializeUser(user) {
  const adminRole = getResolvedAdminRole(user);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminUser(user),
    isMainAdmin: isMainAdminUser(user),
    adminRole,
    avatarUrl: user.avatarPath || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
