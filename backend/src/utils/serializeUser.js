import { getResolvedAdminRole, isAdminUser, isMainAdminUser } from "../config/runtime.js";

export function serializeUser(user) {
  const adminRole = getResolvedAdminRole(user);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    location: user.location || "",
    preferredLanguage: user.preferredLanguage || "English",
    emailNotifications: typeof user.emailNotifications === "boolean" ? user.emailNotifications : true,
    isAdmin: isAdminUser(user),
    isMainAdmin: isMainAdminUser(user),
    adminRole,
    avatarUrl: user.avatarPath || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
