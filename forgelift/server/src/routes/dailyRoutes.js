import express from "express";
import { getDay, updateDay, updateProfile } from "../controllers/dailyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/:day", protect, getDay);
router.patch("/:day", protect, updateDay);

export default router;
