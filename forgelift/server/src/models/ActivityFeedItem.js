import mongoose from "mongoose";

const activityFeedItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["workout_completed"],
      required: true
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout"
    },
    title: String,
    totalVolume: Number,
    totalSets: Number,
    totalReps: Number,
    exerciseCount: Number,
    bestEstimated1RM: Number
  },
  { timestamps: true }
);

activityFeedItemSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityFeedItem", activityFeedItemSchema);
