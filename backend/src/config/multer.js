import fs from "fs";
import path from "path";
import multer from "multer";
import { uploadDir } from "./runtime.js";
import {
  NOTE_FILE_EXTENSIONS,
  NOTE_FILE_MIME_TYPES,
  NOTE_FILE_TYPES_LABEL,
  NOTE_LIMITS
} from "../../../shared/noteLimits.js";

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  }
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const hasAllowedMimeType = NOTE_FILE_MIME_TYPES.includes(file.mimetype);
  const hasAllowedExtension = NOTE_FILE_EXTENSIONS.includes(extension);

  if (hasAllowedMimeType || hasAllowedExtension) {
    callback(null, true);
    return;
  }

  callback(new Error(`Unsupported file type. Upload ${NOTE_FILE_TYPES_LABEL}.`));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: NOTE_LIMITS.fileSizeBytes
  }
});
