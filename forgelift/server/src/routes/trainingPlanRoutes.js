import express from "express";
import { cancelPlan, generatePlan, getStatus, regenerateRemainder } from "../controllers/trainingPlanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getStatus);
router.post("/generate", protect, generatePlan);
router.post("/:id/regenerate-remainder", protect, regenerateRemainder);
router.post("/:id/cancel", protect, cancelPlan);

export default router;
