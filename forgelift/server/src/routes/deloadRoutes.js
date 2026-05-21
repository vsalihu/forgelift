import express from "express";
import {
  getDeloadHistory,
  getDeloadRecommendations,
  getFatigue,
  getPlateaus,
  recalculateDeload,
  updateDeloadStatus
} from "../controllers/deloadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDeloadRecommendations);
router.get("/history", protect, getDeloadHistory);
router.get("/plateaus", protect, getPlateaus);
router.get("/fatigue", protect, getFatigue);
router.post("/recalculate", protect, recalculateDeload);
router.patch("/:id/status", protect, updateDeloadStatus);

export default router;
