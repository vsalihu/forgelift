import mongoose from "mongoose";

const conversationParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true
    },
    participants: {
      type: [conversationParticipantSchema],
      default: []
    },
    lastMessageText: {
      type: String,
      default: ""
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lastMessageType: {
      type: String,
      enum: ["text", "challenge", "workout_session", "system"],
      default: "text"
    },
    lastMessageAt: {
      type: Date
    }
  },
  { timestamps: true }
);

conversationSchema.index({ "participants.userId": 1 });

export const buildPairKey = (userIdA, userIdB) => [String(userIdA), String(userIdB)].sort().join("_");

export default mongoose.model("Conversation", conversationSchema);
