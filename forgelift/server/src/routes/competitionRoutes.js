import express from "express";
import {
  getLeaderboard,
  getMyCompetition,
  getStanding,
  joinOrUpdateCompetition,
  leaveCompetition,
  markStandingSeen,
  searchCompetitionCities,
  setFeaturedBoard
} from "../controllers/competitionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/cities", protect, searchCompetitionCities);
router.get("/me", protect, getMyCompetition);
router.put("/me", protect, joinOrUpdateCompetition);
router.delete("/me", protect, leaveCompetition);
router.put("/me/featured", protect, setFeaturedBoard);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/standing", protect, getStanding);
router.post("/standing/seen", protect, markStandingSeen);

export default router;
