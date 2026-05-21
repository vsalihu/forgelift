import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    streakType: {
      type: String,
      enum: ["weekly_workout", "mission_completion", "goal_path"],
      required: true
    },
    currentCount: {
      type: Number,
      default: 0
    },
    bestCount: {
      type: Number,
      default: 0
    },
    lastUpdated: Date,
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

streakSchema.index({ userId: 1, streakType: 1 }, { unique: true });

export default mongoose.model("Streak", streakSchema);
