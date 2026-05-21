import express from "express";
import {
  deleteStrengthBaseline,
  getStrengthBaselines,
  recalculateStrengthBaselines,
  saveStrengthBaseline,
  updateStrengthBaseline
} from "../controllers/strengthBaselineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getStrengthBaselines);
router.post("/", saveStrengthBaseline);
router.post("/recalculate", recalculateStrengthBaselines);
router.put("/:id", updateStrengthBaseline);
router.delete("/:id", deleteStrengthBaseline);

export default router;
