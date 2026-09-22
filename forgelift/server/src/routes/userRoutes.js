import express from "express";
import { completeOnboarding, getDataReadiness, getMe, getPublicProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/data-readiness", protect, getDataReadiness);
router.get("/:username/profile", protect, getPublicProfile);
router.put("/profile", protect, updateProfile);
router.put("/onboarding", protect, completeOnboarding);

export default router;
