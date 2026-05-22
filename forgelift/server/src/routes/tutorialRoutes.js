import express from "express";
import {
  getPageTutorialProgress,
  getTutorialProgress,
  resetAllTutorials,
  resetTutorial,
  updateTutorialProgress
} from "../controllers/tutorialController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/progress", protect, getTutorialProgress);
router.get("/progress/:pageKey", protect, getPageTutorialProgress);
router.post("/progress/:pageKey", protect, updateTutorialProgress);
router.post("/reset/:pageKey", protect, resetTutorial);
router.post("/reset-all", protect, resetAllTutorials);

export default router;
