import path from "path";

export const ADMIN_ROLES = {
  USER: "user",
  SUB_ADMIN: "sub_admin",
  MAIN_ADMIN: "main_admin"
};

export const isVercel = process.env.VERCEL === "1";
const configuredUploadDir = process.env.UPLOAD_DIR?.trim();
const configuredStorageProvider = process.env.FILE_STORAGE_PROVIDER?.trim().toLowerCase();

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

export function getStorageMode() {
  if (configuredStorageProvider) {
    if (!["local", "r2"].includes(configuredStorageProvider)) {
      throw new Error("FILE_STORAGE_PROVIDER must be either local or r2.");
    }

    return configuredStorageProvider;
  }

  const hasFullR2Config = Boolean(
    process.env.R2_BUCKET?.trim() &&
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim()
  );

  return hasFullR2Config ? "r2" : "local";
}

export function getR2Config() {
  if (getStorageMode() !== "r2") {
    throw new Error("R2 storage is not enabled.");
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const region = process.env.R2_REGION?.trim() || "auto";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 storage is incomplete. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    region,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`
  };
}

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

export function getApiPublicUrl() {
  const configuredUrl = process.env.API_PUBLIC_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api`;
  }

  return "http://127.0.0.1:5000/api";
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
    provider: getStorageMode(),
    uploadDir,
    hasCustomUploadDir: Boolean(configuredUploadDir),
    isEphemeral: getStorageMode() === "local" && isVercel && !configuredUploadDir
  };
}
