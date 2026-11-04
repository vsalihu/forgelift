import express from "express";
import { completeOnboarding, getDataReadiness, getMe, getPublicProfile, markReleaseSeen, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/data-readiness", protect, getDataReadiness);
router.get("/:username/profile", protect, getPublicProfile);
router.put("/profile", protect, updateProfile);
router.put("/onboarding", protect, completeOnboarding);
router.put("/whats-new", protect, markReleaseSeen);

export default router;
