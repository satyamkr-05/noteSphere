import express from "express";
import {
  approveNote,
  deleteAdminNote,
  deleteAdminUser,
  getAdminNotes,
  getAdminUsers,
  loginAdmin,
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

export default router;
