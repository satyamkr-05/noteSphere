import path from "path";
import multer from "multer";

const ALLOWED_AVATAR_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

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
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES
  }
});
