import express from "express";
import {
  approveNote,
  deleteAdminFeedback,
  deleteAdminNote,
  deleteAdminUser,
  getAdminFeedback,
  getAdminNotes,
  getAdminUsers,
  loginAdmin,
  markFeedbackReviewed,
  rejectNote,
  updateAdminNote
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

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

export default router;
