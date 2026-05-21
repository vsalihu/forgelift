import express from "express";
import { completeOnboarding, getDataReadiness, getMe, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/data-readiness", protect, getDataReadiness);
router.put("/profile", protect, updateProfile);
router.put("/onboarding", protect, completeOnboarding);

export default router;
