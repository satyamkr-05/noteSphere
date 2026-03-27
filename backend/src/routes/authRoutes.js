import express from "express";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  validateResetToken
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", requestPasswordReset);
router.get("/reset-password/:token/validate", validateResetToken);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getCurrentUser);

export default router;
