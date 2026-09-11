import { buildAvatarUrl, deleteStorageObject, normalizeStorageKey, saveUploadedFile } from "./storageService.js";

export function buildAvatarAbsolutePath(avatarPath) {
  return normalizeStorageKey(avatarPath);
}

export async function storeAvatarFile(file) {
  return saveUploadedFile(file, "avatar");
}

export async function removeAvatarFile(avatarPath) {
  await deleteStorageObject(avatarPath);
}

export function resolveAvatarUrl(avatarPath) {
  return buildAvatarUrl(avatarPath);
}
