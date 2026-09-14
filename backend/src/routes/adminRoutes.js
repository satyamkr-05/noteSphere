import express from "express";
import {
  createSubAdmin,
  demoteSubAdminToUser,
  deleteAdminFeedback,
  deleteAdminNote,
  deleteAdminQuestionPaper,
  deleteAdminUser,
  deleteSubAdmin,
  getAdminFeedback,
  getAdminNotes,
  getAdminQuestionPapers,
  getAdminSubAdmins,
  getAdminUsers,
  loginAdmin,
  markFeedbackReviewed,
  promoteUserToSubAdmin,
  updateAdminNote
} from "../controllers/adminController.js";
import { adminOnly, mainAdminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);

router.use(protect, adminOnly);

router.get("/notes", getAdminNotes);
router.put("/notes/:id", updateAdminNote);
router.delete("/notes/:id", deleteAdminNote);
router.get("/question-papers", getAdminQuestionPapers);
router.delete("/question-papers/:id", deleteAdminQuestionPaper);
router.get("/users", getAdminUsers);
router.put("/users/:id/promote-sub-admin", mainAdminOnly, promoteUserToSubAdmin);
router.put("/users/:id/remove-sub-admin", mainAdminOnly, demoteSubAdminToUser);
router.delete("/users/:id", deleteAdminUser);
router.get("/feedback", getAdminFeedback);
router.put("/feedback/:id/review", markFeedbackReviewed);
router.delete("/feedback/:id", deleteAdminFeedback);
router.get("/sub-admins", mainAdminOnly, getAdminSubAdmins);
router.post("/sub-admins", mainAdminOnly, createSubAdmin);
router.delete("/sub-admins/:id", mainAdminOnly, deleteSubAdmin);

export default router;
