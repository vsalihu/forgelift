import Conversation, { buildPairKey } from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getFriendIds } from "./friendController.js";

const participantFields = "name username currentOverallRank";

export const isFriend = async (userId, otherUserId) => {
  const friendIds = await getFriendIds(userId);
  return friendIds.some((id) => id.equals(otherUserId));
};

export const getOrCreateConversation = async (userIdA, userIdB) => {
  const pairKey = buildPairKey(userIdA, userIdB);
  let conversation = await Conversation.findOne({ pairKey });

  if (!conversation) {
    conversation = await Conversation.create({
      pairKey,
      participants: [
        { userId: userIdA, unreadCount: 0 },
        { userId: userIdB, unreadCount: 0 }
      ]
    });
  }

  return conversation;
};

export const touchConversation = async (conversation, { senderId, recipientId, text, type }) => {
  conversation.lastMessageText = text;
  conversation.lastMessageSenderId = senderId;
  conversation.lastMessageType = type;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await Conversation.updateOne(
    { _id: conversation._id, "participants.userId": recipientId },
    { $inc: { "participants.$.unreadCount": 1 } }
  );
};

export const postSystemMessage = async (conversation, { text, type = "system", challengeId, coopSessionId, senderId }) => {
  const otherParticipant = conversation.participants.find((participant) => !participant.userId.equals(senderId));
  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    type,
    text,
    challengeId,
    coopSessionId
  });

  if (otherParticipant) {
    await touchConversation(conversation, { senderId, recipientId: otherParticipant.userId, text, type });
  }

  return message;
};

const decorateConversation = (conversation, myUserId, otherUser) => {
  const mine = conversation.participants.find((participant) => participant.userId.equals(myUserId));
  return {
    _id: conversation._id,
    otherUser,
    lastMessageText: conversation.lastMessageText,
    lastMessageSenderId: conversation.lastMessageSenderId,
    lastMessageType: conversation.lastMessageType,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: mine?.unreadCount || 0,
    updatedAt: conversation.updatedAt
  };
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ "participants.userId": req.user._id }).sort({
      lastMessageAt: -1,
      updatedAt: -1
    });

    const otherUserIds = conversations.map((conversation) =>
      conversation.participants.find((participant) => !participant.userId.equals(req.user._id))?.userId
    );

    const otherUsers = await User.find({ _id: { $in: otherUserIds.filter(Boolean) } }).select(participantFields);
    const otherUsersById = new Map(otherUsers.map((user) => [String(user._id), user]));

    const decorated = conversations
      .map((conversation) => {
        const otherId = conversation.participants.find((participant) => !participant.userId.equals(req.user._id))?.userId;
        const otherUser = otherId ? otherUsersById.get(String(otherId)) : null;
        if (!otherUser) return null;
        return decorateConversation(conversation, req.user._id, otherUser);
      })
      .filter(Boolean);

    return res.json({ conversations: decorated });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch conversations.", error: error.message });
  }
};

export const getConversationWithFriend = async (req, res) => {
  try {
    const friend = await User.findOne({ username: (req.params.username || "").toLowerCase() }).select(participantFields);

    if (!friend) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!(await isFriend(req.user._id, friend._id))) {
      return res.status(400).json({ message: "You can only message your friends." });
    }

    const conversation = await getOrCreateConversation(req.user._id, friend._id);
    return res.json({ conversation: decorateConversation(conversation, req.user._id, friend) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to open conversation.", error: error.message });
  }
};

const assertParticipant = (conversation, userId) => {
  if (!conversation.participants.some((participant) => participant.userId.equals(userId))) {
    const error = new Error("Conversation not found.");
    error.statusCode = 404;
    throw error;
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    assertParticipant(conversation, req.user._id);

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const query = { conversationId: conversation._id };
    if (req.query.before) {
      query.createdAt = { $lt: new Date(req.query.before) };
    }

    const messages = await Message.find(query)
      .populate("senderId", "name username")
      .populate("challengeId")
      .populate("coopSessionId")
      .sort({ createdAt: -1 })
      .limit(limit);

    await Conversation.updateOne(
      { _id: conversation._id, "participants.userId": req.user._id },
      { $set: { "participants.$.unreadCount": 0 } }
    );

    return res.json({ messages: messages.reverse() });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to fetch messages." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const text = (req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    if (text.length > 2000) {
      return res.status(400).json({ message: "Message is too long." });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    assertParticipant(conversation, req.user._id);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      type: "text",
      text
    });

    const recipient = conversation.participants.find((participant) => !participant.userId.equals(req.user._id));
    if (recipient) {
      await touchConversation(conversation, { senderId: req.user._id, recipientId: recipient.userId, text, type: "text" });
    }

    await message.populate("senderId", "name username");

    return res.status(201).json({ message });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to send message." });
  }
};
