import express from "express";
import { deleteEntry, getMonth, getPublicMonth, upsertEntry } from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/public/:username/:year/:month", protect, getPublicMonth);
router.get("/:year/:month", protect, getMonth);
router.post("/entries", protect, upsertEntry);
router.delete("/entries/:id", protect, deleteEntry);

export default router;
