import express from "express";
import { createChallenge, getChallenge, getMyChallenges, respondToChallenge } from "../controllers/challengeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyChallenges);
router.post("/", protect, createChallenge);
router.get("/:id", protect, getChallenge);
router.post("/:id/respond", protect, respondToChallenge);

export default router;
