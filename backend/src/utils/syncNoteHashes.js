import Note from "../models/Note.js";
import { buildStoredFileAbsolutePath } from "./noteFiles.js";
import { hashFileAtPath } from "./fileHash.js";

export async function syncNoteHashes() {
  const notes = await Note.find({
    $or: [{ fileHash: { $exists: false } }, { fileHash: "" }, { fileHash: null }]
  });

  for (const note of notes) {
    try {
      const absolutePath = buildStoredFileAbsolutePath(note.filePath);
      note.fileHash = await hashFileAtPath(absolutePath);
      await note.save();
    } catch (error) {
      console.warn(`Unable to sync file hash for note ${note._id}: ${error.message}`);
    }
  }
}
