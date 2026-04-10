import express from "express";
import {
  createNote,
  deleteNote,
  getNoteBranches,
  getNoteCourses,
  getMyNotes,
  getNoteById,
  getNotes,
  getNoteSpecializations,
  getPublicNoteStats,
  getNoteSubjects,
  getTrendingNotes,
  getNoteUnits,
  registerDownload,
  streamNoteFile,
  updateNote
} from "../controllers/noteController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/", getNotes);
router.get("/courses", getNoteCourses);
router.get("/branches", getNoteBranches);
router.get("/specializations", getNoteSpecializations);
router.get("/subjects", getNoteSubjects);
router.get("/units", getNoteUnits);
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
