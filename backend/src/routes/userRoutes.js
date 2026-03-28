import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { avatarUpload } from "../config/avatarUpload.js";
import { getMyProfile, updateMyProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me/profile", protect, getMyProfile);
router.put("/me", protect, avatarUpload.single("avatar"), updateMyProfile);

export default router;
