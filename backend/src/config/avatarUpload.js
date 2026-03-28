import fs from "fs";
import path from "path";
import multer from "multer";
import { avatarDir } from "./runtime.js";

const ALLOWED_AVATAR_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, avatarDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = ALLOWED_AVATAR_EXTENSIONS.includes(extension) ? extension : ".png";
    callback(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
  }
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (
    ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype) &&
    ALLOWED_AVATAR_EXTENSIONS.includes(extension)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error("Profile picture must be a PNG, JPG, JPEG, or WEBP image."));
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES
  }
});
