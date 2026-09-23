import Challenge from "../models/Challenge.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import { getOrCreateConversation, isFriend, postSystemMessage, touchConversation } from "./chatController.js";
import Message from "../models/Message.js";

const participantFields = "name username currentOverallRank";

const getMetricProgress = async (userId, metric, startDate, endDate) => {
  const match = { userId, date: { $gte: startDate, $lte: endDate } };

  if (metric === "workout_count") {
    return Workout.countDocuments(match);
  }

  const result = await Workout.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalVolume" } } }
  ]);

  return result[0]?.total || 0;
};

const finalizeIfExpired = async (challenge) => {
  if (challenge.status !== "active" || !challenge.endDate || challenge.endDate > new Date()) {
    return challenge;
  }

  const [creatorProgress, opponentProgress] = await Promise.all([
    getMetricProgress(challenge.creatorId, challenge.metric, challenge.startDate, challenge.endDate),
    getMetricProgress(challenge.opponentId, challenge.metric, challenge.startDate, challenge.endDate)
  ]);

  challenge.status = "completed";
  if (creatorProgress === opponentProgress) {
    challenge.isTie = true;
  } else {
    challenge.winnerId = creatorProgress > opponentProgress ? challenge.creatorId : challenge.opponentId;
  }
  await challenge.save();

  const conversation = await getOrCreateConversation(challenge.creatorId, challenge.opponentId);
  const winner = challenge.winnerId ? await User.findById(challenge.winnerId).select("name username") : null;
  const text = challenge.isTie
    ? "Challenge ended in a tie!"
    : `Challenge complete! @${winner?.username} wins.`;
  await postSystemMessage(conversation, { text, senderId: challenge.creatorId, challengeId: challenge._id });

  return challenge;
};

const buildChallengeResponse = async (challenge) => {
  const finalized = await finalizeIfExpired(challenge);
  const now = new Date();
  let creatorProgress = 0;
  let opponentProgress = 0;

  if (finalized.startDate && (finalized.status === "active" || finalized.status === "completed")) {
    const rangeEnd = finalized.status === "active" ? now : finalized.endDate;
    [creatorProgress, opponentProgress] = await Promise.all([
      getMetricProgress(finalized.creatorId, finalized.metric, finalized.startDate, rangeEnd),
      getMetricProgress(finalized.opponentId, finalized.metric, finalized.startDate, rangeEnd)
    ]);
  }

  return {
    ...finalized.toObject(),
    creatorProgress,
    opponentProgress
  };
};

export const createChallenge = async (req, res) => {
  try {
    const { friendUserId, metric, durationDays } = req.body;

    if (!friendUserId || !["volume", "workout_count"].includes(metric)) {
      return res.status(400).json({ message: "A friend and a valid metric are required." });
    }

    const duration = Number(durationDays);
    if (!Number.isFinite(duration) || duration < 1 || duration > 90) {
      return res.status(400).json({ message: "Duration must be between 1 and 90 days." });
    }

    if (!(await isFriend(req.user._id, friendUserId))) {
      return res.status(400).json({ message: "You can only challenge your friends." });
    }

    const conversation = await getOrCreateConversation(req.user._id, friendUserId);

    const challenge = await Challenge.create({
      conversationId: conversation._id,
      creatorId: req.user._id,
      opponentId: friendUserId,
      metric,
      durationDays: duration
    });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      type: "challenge",
      text: `Challenge sent: ${metric === "volume" ? "most volume" : "most workouts"} over ${duration} days.`,
      challengeId: challenge._id
    });

    await touchConversation(conversation, {
      senderId: req.user._id,
      recipientId: friendUserId,
      text: message.text,
      type: "challenge"
    });

    return res.status(201).json({ challenge });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create challenge.", error: error.message });
  }
};

export const respondToChallenge = async (req, res) => {
  try {
    const { accept } = req.body;
    const challenge = await Challenge.findOne({ _id: req.params.id, opponentId: req.user._id, status: "pending" });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found." });
    }

    const conversation = await getOrCreateConversation(challenge.creatorId, challenge.opponentId);

    if (accept) {
      challenge.status = "active";
      challenge.startDate = new Date();
      challenge.endDate = new Date(Date.now() + challenge.durationDays * 24 * 60 * 60 * 1000);
      await challenge.save();
      await postSystemMessage(conversation, {
        text: "Challenge accepted! Let's go.",
        senderId: req.user._id,
        challengeId: challenge._id
      });
    } else {
      challenge.status = "declined";
      await challenge.save();
      await postSystemMessage(conversation, {
        text: "Challenge declined.",
        senderId: req.user._id,
        challengeId: challenge._id
      });
    }

    return res.json({ challenge });
  } catch (error) {
    return res.status(500).json({ message: "Unable to respond to challenge.", error: error.message });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      $or: [{ creatorId: req.user._id }, { opponentId: req.user._id }]
    })
      .populate("creatorId", participantFields)
      .populate("opponentId", participantFields)
      .populate("winnerId", participantFields);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found." });
    }

    const response = await buildChallengeResponse(challenge);
    return res.json({ challenge: response });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch challenge.", error: error.message });
  }
};

export const getMyChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({
      $or: [{ creatorId: req.user._id }, { opponentId: req.user._id }]
    })
      .populate("creatorId", participantFields)
      .populate("opponentId", participantFields)
      .sort({ createdAt: -1 });

    return res.json({ challenges });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch challenges.", error: error.message });
  }
};
