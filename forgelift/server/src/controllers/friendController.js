import Friendship from "../models/Friendship.js";
import User from "../models/User.js";

const publicFields = "name username currentOverallRank overallRankScore xp lifetimeVolume lifetimeReps lifetimeSets";

const getAcceptedFriendship = async (userId, otherUserId) =>
  Friendship.findOne({
    status: "accepted",
    $or: [
      { requesterId: userId, recipientId: otherUserId },
      { requesterId: otherUserId, recipientId: userId }
    ]
  });

export const searchUsers = async (req, res) => {
  try {
    const username = (req.query.username || "").trim().toLowerCase();

    if (username.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      username: { $regex: username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
      _id: { $ne: req.user._id }
    })
      .select("name username currentOverallRank")
      .limit(10);

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Unable to search users.", error: error.message });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const username = (req.body.username || "").trim().toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const recipient = await User.findOne({ username });

    if (!recipient) {
      return res.status(404).json({ message: "No user found with that username." });
    }

    if (recipient._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot add yourself as a friend." });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requesterId: req.user._id, recipientId: recipient._id },
        { requesterId: recipient._id, recipientId: req.user._id }
      ]
    });

    if (existing) {
      return res.status(409).json({
        message: existing.status === "accepted" ? "You are already friends." : "A friend request already exists between you two."
      });
    }

    const friendship = await Friendship.create({ requesterId: req.user._id, recipientId: recipient._id });
    return res.status(201).json({ friendship });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send friend request.", error: error.message });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const isSent = req.query.type === "sent";
    const filter = isSent
      ? { requesterId: req.user._id, status: "pending" }
      : { recipientId: req.user._id, status: "pending" };

    const requests = await Friendship.find(filter)
      .populate(isSent ? "recipientId" : "requesterId", "name username currentOverallRank")
      .sort({ createdAt: -1 });

    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch friend requests.", error: error.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const request = await Friendship.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      status: "pending"
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    request.status = "accepted";
    request.respondedAt = new Date();
    await request.save();

    return res.json({ friendship: request });
  } catch (error) {
    return res.status(500).json({ message: "Unable to accept friend request.", error: error.message });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const request = await Friendship.findOneAndDelete({
      _id: req.params.id,
      $or: [{ recipientId: req.user._id }, { requesterId: req.user._id }],
      status: "pending"
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    return res.json({ message: "Friend request removed." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to decline friend request.", error: error.message });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const friendship = await getAcceptedFriendship(req.user._id, req.params.friendUserId);

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found." });
    }

    await friendship.deleteOne();
    return res.json({ message: "Friend removed." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to remove friend.", error: error.message });
  }
};

export const getFriendIds = async (userId) => {
  const friendships = await Friendship.find({
    status: "accepted",
    $or: [{ requesterId: userId }, { recipientId: userId }]
  });

  return friendships.map((friendship) =>
    friendship.requesterId.equals(userId) ? friendship.recipientId : friendship.requesterId
  );
};

export const getFriends = async (req, res) => {
  try {
    const friendIds = await getFriendIds(req.user._id);
    const friends = await User.find({ _id: { $in: friendIds } }).select(publicFields);
    return res.json({ friends });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch friends.", error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const friendIds = await getFriendIds(req.user._id);
    const users = await User.find({ _id: { $in: [req.user._id, ...friendIds] } }).select(publicFields);
    const leaderboard = users
      .map((user) => ({ ...user.toJSON(), isSelf: user._id.equals(req.user._id) }))
      .sort((a, b) => (b.overallRankScore || 0) - (a.overallRankScore || 0));

    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch leaderboard.", error: error.message });
  }
};
