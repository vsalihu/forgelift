import express from "express";
import { getFeed, getInbox, saveInboxWorkout, sendWorkout } from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/feed", protect, getFeed);
router.get("/inbox", protect, getInbox);
router.post("/send-workout", protect, sendWorkout);
router.post("/inbox/:id/save-template", protect, saveInboxWorkout);

export default router;
