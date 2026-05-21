import mongoose from "mongoose";

const deloadRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    scope: {
      type: String,
      enum: ["exercise", "muscle_group", "full_body"],
      required: true,
      index: true
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise"
    },
    exerciseName: {
      type: String,
      trim: true,
      index: true
    },
    muscleGroup: {
      type: String,
      trim: true,
      index: true
    },
    recommendationType: {
      type: String,
      enum: [
        "weight_deload",
        "volume_deload",
        "intensity_deload",
        "rest_deload",
        "technique_reset",
        "full_body_deload"
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low"
    },
    status: {
      type: String,
      enum: ["active", "completed", "ignored", "expired"],
      default: "active",
      index: true
    },
    currentWeight: {
      type: Number,
      default: 0
    },
    recommendedWeight: {
      type: Number,
      default: 0
    },
    currentVolume: {
      type: Number,
      default: 0
    },
    recommendedVolume: {
      type: Number,
      default: 0
    },
    reductionPercentage: {
      type: Number,
      default: 0
    },
    recommendedRestDays: {
      type: Number,
      default: 0
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
    plan: {
      type: Object,
      default: {}
    },
    evidence: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

deloadRecommendationSchema.index({ userId: 1, scope: 1, exerciseName: 1, muscleGroup: 1, status: 1, createdAt: -1 });

export default mongoose.model("DeloadRecommendation", deloadRecommendationSchema);
