import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["text", "challenge", "workout_session", "system"],
      default: "text"
    },
    text: {
      type: String,
      default: ""
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge"
    },
    coopSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoopWorkoutSession"
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
