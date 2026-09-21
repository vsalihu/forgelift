import mongoose from "mongoose";

const sharedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise"
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true
    },
    targetSets: Number,
    targetRepMin: Number,
    targetRepMax: Number,
    notes: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

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
      enum: ["workout_completed", "workout_shared"],
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
    bestEstimated1RM: Number,
    workoutName: String,
    workoutDescription: String,
    sharedExercises: {
      type: [sharedExerciseSchema],
      default: undefined
    }
  },
  { timestamps: true }
);

activityFeedItemSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityFeedItem", activityFeedItemSchema);
