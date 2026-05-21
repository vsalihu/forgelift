import mongoose from "mongoose";

const weakPointSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "muscle_rank_gap",
        "low_direct_volume",
        "push_pull_imbalance",
        "upper_lower_imbalance",
        "front_rear_imbalance",
        "low_frequency",
        "stalled_progress",
        "indirect_only_training",
        "goal_path_mismatch",
        "insufficient_data"
      ],
      required: true,
      index: true
    },
    muscleGroup: {
      type: String,
      default: "",
      index: true
    },
    relatedMuscles: {
      type: [String],
      default: []
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low"
    },
    scoreImpact: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    recommendation: {
      type: String,
      default: ""
    },
    evidence: {
      type: Object,
      default: {}
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    detectedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

weakPointSchema.index({ userId: 1, active: 1 });
weakPointSchema.index({ userId: 1, muscleGroup: 1, type: 1, active: 1 });

export default mongoose.model("WeakPoint", weakPointSchema);
