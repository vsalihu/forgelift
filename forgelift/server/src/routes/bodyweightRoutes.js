import express from "express";
import {
  addBodyweightEntry,
  checkInBodyweight,
  deleteBodyweightEntry,
  getBodyweightHistory,
  getLatestBodyweight
} from "../controllers/bodyweightController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getBodyweightHistory);
router.get("/latest", protect, getLatestBodyweight);
router.post("/", protect, addBodyweightEntry);
router.post("/check-in", protect, checkInBodyweight);
router.delete("/:id", protect, deleteBodyweightEntry);

export default router;
