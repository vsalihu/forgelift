import express from "express";
import {
  generateReport,
  getCurrentMonthlyReport,
  getMonthlyReport,
  getMonthlyReports
} from "../controllers/monthlyReportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMonthlyReports);
router.get("/current", protect, getCurrentMonthlyReport);
router.get("/:year/:month", protect, getMonthlyReport);
router.post("/generate", protect, generateReport);

export default router;
