import express from "express";
import { blockUser, getBlockedUsers, reportUser, unblockUser } from "../controllers/safetyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/blocks", protect, getBlockedUsers);
router.post("/blocks", protect, blockUser);
router.delete("/blocks/:username", protect, unblockUser);
router.post("/reports", protect, reportUser);

export default router;
