import express from "express";
import {
  createQuestionPaper,
  deleteQuestionPaper,
  getMyQuestionPapers,
  getQuestionBankCourses,
  getQuestionBankSemesters,
  getQuestionBankSubjects,
  getQuestionBankUniversities,
  getQuestionPaperById,
  getQuestionPapers,
  getTrendingQuestionPapers,
  registerQuestionPaperDownload,
  streamQuestionPaperFile,
  updateQuestionPaper
} from "../controllers/questionBankController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/universities", getQuestionBankUniversities);
router.get("/courses", getQuestionBankCourses);
router.get("/semesters", getQuestionBankSemesters);
router.get("/subjects", getQuestionBankSubjects);
router.get("/papers", getQuestionPapers);
router.get("/papers/trending", getTrendingQuestionPapers);
router.get("/papers/mine", protect, getMyQuestionPapers);
router.get("/papers/:id", getQuestionPaperById);
router.get("/papers/:id/file", protect, streamQuestionPaperFile);
router.get("/papers/:id/download", protect, registerQuestionPaperDownload);
router.post("/papers", protect, upload.single("file"), createQuestionPaper);
router.put("/papers/:id", protect, upload.single("file"), updateQuestionPaper);
router.delete("/papers/:id", protect, deleteQuestionPaper);

export default router;
