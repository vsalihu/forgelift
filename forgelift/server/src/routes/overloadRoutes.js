import express from "express";
import {
  getExerciseOverloadRecommendation,
  getOverloadRecommendations,
  recalculateOverloadRecommendations,
  updateOverloadStatus
} from "../controllers/overloadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getOverloadRecommendations);
router.get("/exercise/:exerciseName", protect, getExerciseOverloadRecommendation);
router.post("/recalculate", protect, recalculateOverloadRecommendations);
router.patch("/:id/status", protect, updateOverloadStatus);

export default router;
