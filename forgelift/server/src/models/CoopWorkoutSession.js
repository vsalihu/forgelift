import mongoose from "mongoose";

const coopParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedSets: {
      type: Number,
      default: 0
    },
    totalVolume: {
      type: Number,
      default: 0
    },
    currentExerciseName: {
      type: String,
      default: ""
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout"
    },
    finishedAt: {
      type: Date
    },
    lastUpdatedAt: {
      type: Date
    }
  },
  { _id: false }
);

const coopWorkoutSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      default: "Workout together"
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "declined", "cancelled"],
      default: "pending"
    },
    startedAt: {
      type: Date
    },
    participants: {
      type: [coopParticipantSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("CoopWorkoutSession", coopWorkoutSessionSchema);
