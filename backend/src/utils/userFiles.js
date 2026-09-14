import { buildAvatarUrl } from "./storageService.js";

export function resolveAvatarUrl(avatarPath) {
  return buildAvatarUrl(avatarPath);
}
