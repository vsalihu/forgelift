import express from "express";
import {
  generateMissions,
  getMissionHistory,
  getMissions,
  getWeeklyTarget,
  recalculateMissions,
  updateMissionStatus
} from "../controllers/missionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMissions);
router.get("/history", protect, getMissionHistory);
router.post("/generate", protect, generateMissions);
router.post("/recalculate", protect, recalculateMissions);
router.get("/weekly-target", protect, getWeeklyTarget);
router.patch("/:id/status", protect, updateMissionStatus);

export default router;
