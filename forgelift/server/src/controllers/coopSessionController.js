import CoopWorkoutSession from "../models/CoopWorkoutSession.js";
import User from "../models/User.js";
import { getOrCreateConversation, isFriend, postSystemMessage, touchConversation } from "./chatController.js";
import Message from "../models/Message.js";

const participantFields = "name username currentOverallRank";

const assertParticipant = (session, userId) => {
  const isParticipant = session.hostId.equals(userId) || session.guestId.equals(userId);
  if (!isParticipant) {
    const error = new Error("Workout session not found.");
    error.statusCode = 404;
    throw error;
  }
};

const decorateSession = async (session) => {
  const plain = session.toObject();
  const userIds = [session.hostId, session.guestId];
  const users = await User.find({ _id: { $in: userIds } }).select(participantFields);
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return {
    ...plain,
    participants: plain.participants.map((participant) => ({
      ...participant,
      user: usersById.get(String(participant.userId)) || null
    }))
  };
};

export const createCoopSession = async (req, res) => {
  try {
    const { friendUserId, title } = req.body;

    if (!friendUserId) {
      return res.status(400).json({ message: "friendUserId is required." });
    }

    if (!(await isFriend(req.user._id, friendUserId))) {
      return res.status(400).json({ message: "You can only train with your friends." });
    }

    const conversation = await getOrCreateConversation(req.user._id, friendUserId);

    const session = await CoopWorkoutSession.create({
      conversationId: conversation._id,
      hostId: req.user._id,
      guestId: friendUserId,
      title: title?.trim() || "Workout together",
      participants: [{ userId: req.user._id }, { userId: friendUserId }]
    });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      type: "workout_session",
      text: `Invited you to train together: ${session.title}`,
      coopSessionId: session._id
    });

    await touchConversation(conversation, {
      senderId: req.user._id,
      recipientId: friendUserId,
      text: message.text,
      type: "workout_session"
    });

    return res.status(201).json({ session });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create workout session.", error: error.message });
  }
};

export const respondToCoopSession = async (req, res) => {
  try {
    const { accept } = req.body;
    const session = await CoopWorkoutSession.findOne({ _id: req.params.id, guestId: req.user._id, status: "pending" });

    if (!session) {
      return res.status(404).json({ message: "Workout session not found." });
    }

    const conversation = await getOrCreateConversation(session.hostId, session.guestId);

    if (accept) {
      session.status = "active";
      session.startedAt = new Date();
      await session.save();
      await postSystemMessage(conversation, {
        text: "Joined the workout session. Let's train!",
        senderId: req.user._id,
        coopSessionId: session._id
      });
    } else {
      session.status = "declined";
      await session.save();
      await postSystemMessage(conversation, {
        text: "Declined the workout session.",
        senderId: req.user._id,
        coopSessionId: session._id
      });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ message: "Unable to respond to workout session.", error: error.message });
  }
};

export const getCoopSession = async (req, res) => {
  try {
    const session = await CoopWorkoutSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Workout session not found." });
    }

    assertParticipant(session, req.user._id);

    return res.json({ session: await decorateSession(session) });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to fetch workout session." });
  }
};

export const getActiveCoopSession = async (req, res) => {
  try {
    const session = await CoopWorkoutSession.findOne({
      status: "active",
      $or: [{ hostId: req.user._id }, { guestId: req.user._id }]
    }).sort({ startedAt: -1 });

    if (!session) {
      return res.json({ session: null });
    }

    return res.json({ session: await decorateSession(session) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch active workout session.", error: error.message });
  }
};

export const updateCoopProgress = async (req, res) => {
  try {
    const { completedSets, totalVolume, currentExerciseName } = req.body;
    const session = await CoopWorkoutSession.findOne({ _id: req.params.id, status: "active" });

    if (!session) {
      return res.status(404).json({ message: "Active workout session not found." });
    }

    assertParticipant(session, req.user._id);

    const participant = session.participants.find((item) => item.userId.equals(req.user._id));
    if (!participant) {
      return res.status(404).json({ message: "You are not part of this session." });
    }

    participant.completedSets = Number(completedSets) || 0;
    participant.totalVolume = Number(totalVolume) || 0;
    participant.currentExerciseName = currentExerciseName || "";
    participant.lastUpdatedAt = new Date();
    await session.save();

    return res.json({ session: await decorateSession(session) });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to update progress." });
  }
};

export const finishCoopSession = async (req, res) => {
  try {
    const { workoutId } = req.body;
    const session = await CoopWorkoutSession.findOne({ _id: req.params.id, status: "active" });

    if (!session) {
      return res.status(404).json({ message: "Active workout session not found." });
    }

    assertParticipant(session, req.user._id);

    const participant = session.participants.find((item) => item.userId.equals(req.user._id));
    if (!participant) {
      return res.status(404).json({ message: "You are not part of this session." });
    }

    participant.workoutId = workoutId || undefined;
    participant.finishedAt = new Date();

    const allFinished = session.participants.every((item) => item.finishedAt);
    if (allFinished) {
      session.status = "completed";
    }
    await session.save();

    if (allFinished) {
      const conversation = await getOrCreateConversation(session.hostId, session.guestId);
      const decorated = await decorateSession(session);
      const summary = decorated.participants
        .map((item) => `${item.user?.name || "A friend"}: ${Math.round(item.totalVolume || 0)}kg`)
        .join(" vs ");
      await postSystemMessage(conversation, {
        text: `Workout together complete! ${summary}`,
        senderId: req.user._id,
        coopSessionId: session._id
      });
    }

    return res.json({ session: await decorateSession(session) });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to finish workout session." });
  }
};
