import {
  buildStoredFileAbsolutePath,
  deleteStorageObject,
  hasStorageObject,
  saveUploadedFile,
  streamStorageObjectToResponse
} from "./storageService.js";

export { buildStoredFileAbsolutePath };

export async function storeNoteFile(file) {
  return saveUploadedFile(file, "note");
}

export async function storeQuestionPaperFile(file) {
  return saveUploadedFile(file, "questionPaper");
}

export async function removeStoredFile(filePath) {
  try {
    await deleteStorageObject(filePath);
  } catch (error) {
    console.warn(`Unable to remove stored file: ${filePath}`, error);
  }
}

export async function hasStoredFile(filePath) {
  return hasStorageObject(filePath);
}

export async function sendStoredFileResponse(res, filePath, fileName, disposition = "inline") {
  await streamStorageObjectToResponse(res, filePath, fileName, disposition);
}
