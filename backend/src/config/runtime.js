import path from "path";

export const ADMIN_ROLES = {
  USER: "user",
  SUB_ADMIN: "sub_admin",
  MAIN_ADMIN: "main_admin"
};

export const isVercel = process.env.VERCEL === "1";
const configuredUploadDir = process.env.UPLOAD_DIR?.trim();

function getConfiguredClientOrigins() {
  return process.env.CLIENT_URL?.split(",")
    .map((url) => url.trim())
    .filter(Boolean) || [];
}

export const uploadDir = configuredUploadDir
  ? path.resolve(configuredUploadDir)
  : isVercel
    ? path.join("/tmp", "notesphere-uploads")
    : path.join(process.cwd(), "backend", "uploads");
export const avatarDir = path.join(uploadDir, "avatars");

export function getAllowedOrigins() {
  const configuredOrigins = getConfiguredClientOrigins();

  const defaults = ["http://127.0.0.1:5173", "http://localhost:5173"];

  if (process.env.VERCEL_URL) {
    defaults.push(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    defaults.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }

  return [...new Set([...(configuredOrigins || []), ...defaults])];
}

export function getPrimaryClientUrl() {
  const [configuredOrigin] = getConfiguredClientOrigins();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return "http://127.0.0.1:5173";
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

export function getAdminName() {
  return process.env.ADMIN_NAME?.trim() || "Satyam Kumar";
}

export function isAdminEmail(email = "") {
  const adminEmail = getAdminEmail();
  return Boolean(adminEmail && email.trim().toLowerCase() === adminEmail);
}

export function isMainAdminEmail(email = "") {
  return isAdminEmail(email);
}

export function getResolvedAdminRole(userOrEmail) {
  if (!userOrEmail) {
    return ADMIN_ROLES.USER;
  }

  const email = typeof userOrEmail === "string"
    ? userOrEmail
    : userOrEmail.email || "";
  const storedRole = typeof userOrEmail === "string"
    ? ADMIN_ROLES.USER
    : userOrEmail.adminRole || ADMIN_ROLES.USER;

  if (isMainAdminEmail(email)) {
    return ADMIN_ROLES.MAIN_ADMIN;
  }

  if (storedRole === ADMIN_ROLES.SUB_ADMIN || storedRole === ADMIN_ROLES.MAIN_ADMIN) {
    return storedRole;
  }

  return ADMIN_ROLES.USER;
}

export function isAdminUser(userOrEmail) {
  const role = getResolvedAdminRole(userOrEmail);
  return role === ADMIN_ROLES.MAIN_ADMIN || role === ADMIN_ROLES.SUB_ADMIN;
}

export function isMainAdminUser(userOrEmail) {
  return getResolvedAdminRole(userOrEmail) === ADMIN_ROLES.MAIN_ADMIN;
}

export function getStorageConfig() {
  return {
    uploadDir,
    hasCustomUploadDir: Boolean(configuredUploadDir),
    isEphemeral: isVercel && !configuredUploadDir
  };
}
