import express from "express";
import { completeOnboarding, getMe, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/onboarding", protect, completeOnboarding);

export default router;
