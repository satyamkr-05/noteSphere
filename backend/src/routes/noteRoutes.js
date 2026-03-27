import express from "express";
import {
  createNote,
  deleteNote,
  getMyNotes,
  getNoteById,
  getNotes,
  getPublicNoteStats,
  getTrendingNotes,
  registerDownload,
  streamNoteFile,
  updateNote
} from "../controllers/noteController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/", getNotes);
router.get("/stats", getPublicNoteStats);
router.get("/trending", getTrendingNotes);
router.get("/mine", protect, getMyNotes);
router.get("/:id", getNoteById);
router.get("/:id/file", protect, streamNoteFile);
router.get("/:id/download", protect, registerDownload);
router.post("/", protect, upload.single("file"), createNote);
router.put("/:id", protect, upload.single("file"), updateNote);
router.delete("/:id", protect, deleteNote);

export default router;
