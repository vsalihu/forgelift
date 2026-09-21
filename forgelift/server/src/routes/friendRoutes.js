import express from "express";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  getLeaderboard,
  removeFriend,
  searchUsers,
  sendFriendRequest
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/requests", protect, getFriendRequests);
router.post("/requests", protect, sendFriendRequest);
router.post("/requests/:id/accept", protect, acceptFriendRequest);
router.post("/requests/:id/decline", protect, declineFriendRequest);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/", protect, getFriends);
router.delete("/:friendUserId", protect, removeFriend);

export default router;
