import mongoose from "mongoose";

const weeklyTargetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    weekStart: {
      type: Date,
      required: true
    },
    weekEnd: {
      type: Date,
      required: true
    },
    targetWorkouts: {
      type: Number,
      default: 3
    },
    completedWorkouts: {
      type: Number,
      default: 0
    },
    targetVolume: {
      type: Number,
      default: 0
    },
    completedVolume: {
      type: Number,
      default: 0
    },
    targetMuscleGroups: {
      type: [String],
      default: []
    },
    completedMuscleGroups: {
      type: [String],
      default: []
    },
    targetDirectMuscleLoads: {
      type: Object,
      default: {}
    },
    completedDirectMuscleLoads: {
      type: Object,
      default: {}
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed", "expired"],
      default: "active"
    }
  },
  { timestamps: true }
);

weeklyTargetSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.model("WeeklyTarget", weeklyTargetSchema);
