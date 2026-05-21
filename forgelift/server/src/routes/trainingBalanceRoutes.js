import express from "express";
import { getTrainingBalance, recalculateTrainingBalance } from "../controllers/trainingBalanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTrainingBalance);
router.post("/recalculate", protect, recalculateTrainingBalance);

export default router;
