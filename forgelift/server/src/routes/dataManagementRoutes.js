import express from "express";
import {
  deleteDataRange,
  getDataSummary,
  resetStrengthBaselines,
  resetTrainingData
} from "../controllers/dataManagementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getDataSummary);
router.post("/delete-range", deleteDataRange);
router.post("/reset-training", resetTrainingData);
router.post("/reset-strength-baselines", resetStrengthBaselines);

export default router;
