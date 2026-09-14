import path from "path";
import multer from "multer";
import {
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES,
  NOTE_FILE_TYPES_LABEL,
  NOTE_LIMITS
} from "../../../shared/noteLimits.js";

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const hasAllowedMimeType = NOTE_FILE_MIME_TYPES.includes(file.mimetype);
  const hasAllowedExtension = NOTE_FILE_EXTENSIONS.includes(extension);

  if (hasAllowedMimeType && hasAllowedExtension) {
    callback(null, true);
    return;
  }

  callback(new Error(`Unsupported file type. Upload ${NOTE_FILE_TYPES_LABEL}.`));
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: NOTE_LIMITS.fileSizeBytes
  }
});
