import express from "express";
import {
  getMuscleRecovery,
  getRecoveryScores,
  getTodayRecommendation,
  recalculateRecovery
} from "../controllers/recoveryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRecoveryScores);
router.post("/recalculate", protect, recalculateRecovery);
router.get("/today", protect, getTodayRecommendation);
router.get("/muscle/:muscleGroup", protect, getMuscleRecovery);

export default router;
