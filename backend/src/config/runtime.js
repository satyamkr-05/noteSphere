import path from "path";

export const isVercel = process.env.VERCEL === "1";
const configuredUploadDir = process.env.UPLOAD_DIR?.trim();

export const uploadDir = configuredUploadDir
  ? path.resolve(configuredUploadDir)
  : isVercel
    ? path.join("/tmp", "notesphere-uploads")
    : path.join(process.cwd(), "backend", "uploads");

export function getAllowedOrigins() {
  const configuredOrigins = process.env.CLIENT_URL?.split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  const defaults = ["http://127.0.0.1:5173", "http://localhost:5173"];

  if (process.env.VERCEL_URL) {
    defaults.push(`https://${process.env.VERCEL_URL}`);
  }

  return defaults;
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

export function getStorageConfig() {
  return {
    uploadDir,
    hasCustomUploadDir: Boolean(configuredUploadDir),
    isEphemeral: isVercel && !configuredUploadDir
  };
}
