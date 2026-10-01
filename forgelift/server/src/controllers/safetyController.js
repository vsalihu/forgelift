import Block from "../models/Block.js";
import Friendship from "../models/Friendship.js";
import Report, { REPORT_REASONS } from "../models/Report.js";
import User from "../models/User.js";

const findTarget = async (req, res) => {
  const username = String(req.body.username || req.params.username || "").trim().toLowerCase();
  const target = username ? await User.findOne({ username }).select("_id username") : null;

  if (!target) {
    res.status(404).json({ message: "User not found." });
    return null;
  }

  if (target._id.equals(req.user._id)) {
    res.status(400).json({ message: "You can't do that to yourself." });
    return null;
  }

  return target;
};

export const blockUser = async (req, res) => {
  try {
    const target = await findTarget(req, res);
    if (!target) return undefined;

    await Block.updateOne(
      { blockerId: req.user._id, blockedId: target._id },
      { $setOnInsert: { blockerId: req.user._id, blockedId: target._id } },
      { upsert: true }
    );
    // Blocking ends any friendship or pending request between the two.
    await Friendship.deleteMany({
      $or: [
        { requesterId: req.user._id, recipientId: target._id },
        { requesterId: target._id, recipientId: req.user._id }
      ]
    });

    return res.json({ blocked: true });
  } catch (error) {
    return res.status(500).json({ message: "Unable to block user.", error: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const target = await findTarget(req, res);
    if (!target) return undefined;
    await Block.deleteOne({ blockerId: req.user._id, blockedId: target._id });
    return res.json({ blocked: false });
  } catch (error) {
    return res.status(500).json({ message: "Unable to unblock user.", error: error.message });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.find({ blockerId: req.user._id }).populate("blockedId", "name username").sort({ createdAt: -1 });
    return res.json({
      users: blocks.filter((block) => block.blockedId).map((block) => ({
        _id: block.blockedId._id,
        name: block.blockedId.name,
        username: block.blockedId.username
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load blocked users.", error: error.message });
  }
};

export const reportUser = async (req, res) => {
  try {
    const target = await findTarget(req, res);
    if (!target) return undefined;

    const reason = String(req.body.reason || "");
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Choose a reason for the report." });
    }

    const details = String(req.body.details || "").trim().slice(0, 1000);
    const recentDuplicate = await Report.exists({
      reporterId: req.user._id,
      reportedUserId: target._id,
      reason,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (!recentDuplicate) {
      await Report.create({ reporterId: req.user._id, reportedUserId: target._id, reason, details });
    }

    return res.status(201).json({ reported: true });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send report.", error: error.message });
  }
};
