import mongoose from "mongoose";

const recoveryScoreSchema = new mongoose.Schema(
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
      default: null
    },
    status: {
      type: String,
      enum: ["No Data", "Fully Recovered", "Mostly Ready", "Not Fully Recovered", "Poor Recovery"],
      default: "No Data"
    },
    confidence: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none"
    },
    dataAvailable: {
      type: Boolean,
      default: false
    },
    restRecommendationHours: {
      type: Number,
      default: 0
    },
    nextRecommendedTrainingTime: Date,
    lastDirectLoadAt: Date,
    lastIndirectLoadAt: Date,
    lastStabiliserLoadAt: Date,
    lastTotalLoad: {
      type: Number,
      default: 0
    },
    lastDirectLoad: {
      type: Number,
      default: 0
    },
    lastIndirectLoad: {
      type: Number,
      default: 0
    },
    lastStabiliserLoad: {
      type: Number,
      default: 0
    },
    latestWorkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout"
    },
    reasons: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

recoveryScoreSchema.index({ userId: 1, muscleGroup: 1 }, { unique: true });

export default mongoose.model("RecoveryScore", recoveryScoreSchema);
