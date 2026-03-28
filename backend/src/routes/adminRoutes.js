import express from "express";
import {
  approveNote,
  createSubAdmin,
  deleteAdminFeedback,
  deleteAdminNote,
  deleteAdminUser,
  deleteSubAdmin,
  getAdminFeedback,
  getAdminNotes,
  getAdminSubAdmins,
  getAdminUsers,
  loginAdmin,
  markFeedbackReviewed,
  rejectNote,
  updateAdminNote
} from "../controllers/adminController.js";
import { adminOnly, mainAdminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);

router.use(protect, adminOnly);

router.get("/notes", getAdminNotes);
router.put("/notes/:id", updateAdminNote);
router.put("/notes/:id/approve", approveNote);
router.put("/notes/:id/reject", rejectNote);
router.delete("/notes/:id", deleteAdminNote);
router.get("/users", getAdminUsers);
router.delete("/users/:id", deleteAdminUser);
router.get("/feedback", getAdminFeedback);
router.put("/feedback/:id/review", markFeedbackReviewed);
router.delete("/feedback/:id", deleteAdminFeedback);
router.get("/sub-admins", mainAdminOnly, getAdminSubAdmins);
router.post("/sub-admins", mainAdminOnly, createSubAdmin);
router.delete("/sub-admins/:id", mainAdminOnly, deleteSubAdmin);

export default router;
