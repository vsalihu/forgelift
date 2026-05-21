import express from "express";
import {
  getPersonalRecordSummary,
  getPersonalRecordTimeline,
  getPersonalRecords
} from "../controllers/personalRecordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPersonalRecords);
router.get("/timeline", protect, getPersonalRecordTimeline);
router.get("/summary", protect, getPersonalRecordSummary);

export default router;
