import mongoose from "mongoose";

const muscleRankSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    muscleGroup: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    rank: {
      type: String,
      default: "Copper"
    },
    progressPercentage: {
      type: Number,
      default: 0
    },
    nextRank: {
      type: String,
      default: "Bronze"
    },
    pointsToNextRank: {
      type: Number,
      default: 1000
    },
    strongestExercise: {
      type: String,
      default: ""
    },
    bestEstimated1RM: {
      type: Number,
      default: 0
    },
    totalVolume: {
      type: Number,
      default: 0
    },
    workoutCount: {
      type: Number,
      default: 0
    },
    lastTrainedAt: Date,
    dataAvailable: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none"
    },
    dataStatus: {
      type: String,
      enum: ["unassessed", "limited_history", "sufficient_history"],
      default: "unassessed"
    }
  },
  { timestamps: true }
);

muscleRankSchema.index({ userId: 1, muscleGroup: 1 }, { unique: true });

export default mongoose.model("MuscleRank", muscleRankSchema);
