import express from "express";
import {
  completeAssessment,
  getAssessmentHistory,
  getLatestAssessment,
  recalculateAssessment,
  skipAssessment
} from "../controllers/assessmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/latest", getLatestAssessment);
router.post("/complete", completeAssessment);
router.post("/skip", skipAssessment);
router.get("/history", getAssessmentHistory);
router.post("/recalculate", recalculateAssessment);

export default router;
