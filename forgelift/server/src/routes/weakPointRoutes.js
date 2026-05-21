import express from "express";
import { getWeakPointHistory, getWeakPoints, recalculateWeakPoints } from "../controllers/weakPointController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWeakPoints);
router.post("/recalculate", protect, recalculateWeakPoints);
router.get("/history", protect, getWeakPointHistory);

export default router;
