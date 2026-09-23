import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    opponentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    metric: {
      type: String,
      enum: ["volume", "workout_count"],
      required: true
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "declined", "cancelled"],
      default: "pending"
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isTie: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Challenge", challengeSchema);
