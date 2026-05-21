import express from "express";
import { getMuscleRank, getRanks, recalculateRanks } from "../controllers/rankController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRanks);
router.post("/recalculate", protect, recalculateRanks);
router.get("/muscle/:muscleGroup", protect, getMuscleRank);

export default router;
