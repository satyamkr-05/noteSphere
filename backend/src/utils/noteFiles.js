import fs from "fs";
import path from "path";
import { uploadDir } from "../config/runtime.js";

export function buildStoredFileAbsolutePath(filePath) {
  return path.join(uploadDir, path.basename(filePath));
}

export function removeStoredFile(filePath) {
  if (!filePath) {
    return;
  }

  const absolutePath = buildStoredFileAbsolutePath(filePath);

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.warn(`Unable to remove stored file: ${absolutePath}`, error);
  }
}

export function hasStoredFile(filePath) {
  if (!filePath) {
    return false;
  }

  return fs.existsSync(buildStoredFileAbsolutePath(filePath));
}
