import mongoose from "mongoose";

const overloadRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise"
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    muscleGroups: {
      type: [String],
      default: []
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout"
    },
    recommendationType: {
      type: String,
      enum: [
        "increase_weight",
        "repeat_weight",
        "reduce_weight",
        "increase_reps",
        "reduce_volume",
        "recovery_warning",
        "plateau_warning",
        "deload_flag"
      ],
      required: true
    },
    currentWeight: {
      type: Number,
      default: 0
    },
    recommendedWeight: {
      type: Number,
      default: 0
    },
    currentRepTarget: {
      type: String,
      default: ""
    },
    recommendedRepTarget: {
      type: String,
      default: ""
    },
    recommendedSets: {
      type: Number,
      default: 0
    },
    confidence: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    reason: {
      type: String,
      required: true
    },
    detailedReasons: {
      type: [String],
      default: []
    },
    warnings: {
      type: [String],
      default: []
    },
    goalPathContext: {
      type: String,
      default: ""
    },
    recoveryContext: {
      type: String,
      default: ""
    },
    weakPointContext: {
      type: String,
      default: ""
    },
    dataStatus: {
      type: String,
      enum: ["no_data", "baseline_only", "limited_history", "sufficient_history"],
      default: "limited_history"
    },
    isEstimate: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "completed", "ignored", "expired"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

overloadRecommendationSchema.index({ userId: 1, exerciseName: 1, status: 1, createdAt: -1 });

export default mongoose.model("OverloadRecommendation", overloadRecommendationSchema);
