import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    missionType: {
      type: String,
      enum: [
        "workout_frequency",
        "muscle_focus",
        "overload_target",
        "recovery_discipline",
        "deload_compliance",
        "weak_point_fix",
        "training_balance",
        "pr_challenge",
        "consistency",
        "goal_path"
      ],
      required: true,
      index: true
    },
    goalPath: {
      type: String,
      default: ""
    },
    targetMuscleGroups: {
      type: [String],
      default: []
    },
    targetExerciseName: {
      type: String,
      default: ""
    },
    targetValue: {
      type: Number,
      default: 1
    },
    currentValue: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: ""
    },
    progressPercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed", "expired"],
      default: "active",
      index: true
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true
    },
    xpReward: {
      type: Number,
      default: 100
    },
    rankScoreReward: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    completedAt: Date,
    evidence: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

missionSchema.index({ userId: 1, status: 1, endDate: 1, priority: 1 });

export default mongoose.model("Mission", missionSchema);
