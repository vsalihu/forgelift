import express from "express";
import {
  createCoopSession,
  finishCoopSession,
  getActiveCoopSession,
  getCoopSession,
  respondToCoopSession,
  updateCoopProgress
} from "../controllers/coopSessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/active", protect, getActiveCoopSession);
router.post("/", protect, createCoopSession);
router.get("/:id", protect, getCoopSession);
router.post("/:id/respond", protect, respondToCoopSession);
router.put("/:id/progress", protect, updateCoopProgress);
router.post("/:id/finish", protect, finishCoopSession);

export default router;
