import fs from "fs";
import path from "path";
import { avatarDir } from "../config/runtime.js";

export function buildAvatarAbsolutePath(avatarPath) {
  return path.join(avatarDir, path.basename(avatarPath));
}

export function removeAvatarFile(avatarPath) {
  if (!avatarPath) {
    return;
  }

  const absolutePath = buildAvatarAbsolutePath(avatarPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}
