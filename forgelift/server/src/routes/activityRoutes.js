import express from "express";
import { getFeed, saveSharedTemplate, shareWorkout } from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/feed", protect, getFeed);
router.post("/share-workout", protect, shareWorkout);
router.post("/feed/:id/save-template", protect, saveSharedTemplate);

export default router;
