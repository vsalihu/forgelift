import express from "express";
import { getProgressAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/progress", protect, getProgressAnalytics);

export default router;
