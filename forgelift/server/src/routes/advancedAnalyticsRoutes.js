import express from "express";
import {
  createSnapshot,
  getAnalyticsOverview,
  getInsights,
  getMuscleLoadDistribution,
  getStrengthTrends,
  getVolumeTrends
} from "../controllers/advancedAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getAnalyticsOverview);
router.get("/volume", protect, getVolumeTrends);
router.get("/strength", protect, getStrengthTrends);
router.get("/muscle-load", protect, getMuscleLoadDistribution);
router.get("/insights", protect, getInsights);
router.post("/snapshot", protect, createSnapshot);

export default router;
