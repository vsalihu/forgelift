import express from "express";
import {
  createSnapshot,
  deleteStrengthGoal,
  getAnalyticsOverview,
  getInsights,
  getMuscleLoadDistribution,
  getProgressAnalytics,
  getStrengthTrends,
  getVolumeTrends,
  setStrengthGoal
} from "../controllers/advancedAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getAnalyticsOverview);
router.get("/volume", protect, getVolumeTrends);
router.get("/strength", protect, getStrengthTrends);
router.get("/muscle-load", protect, getMuscleLoadDistribution);
router.get("/insights", protect, getInsights);
router.post("/snapshot", protect, createSnapshot);
router.get("/progress", protect, getProgressAnalytics);
router.put("/goals", protect, setStrengthGoal);
router.delete("/goals/:exerciseName", protect, deleteStrengthGoal);

export default router;
