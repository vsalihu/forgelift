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

const sharedWorkoutSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sourceTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutTemplate"
    },
    workoutName: {
      type: String,
      required: true
    },
    workoutDescription: {
      type: String,
      default: ""
    },
    exercises: {
      type: [sharedExerciseSchema],
      default: []
    }
  },
  { timestamps: true }
);

sharedWorkoutSchema.index({ toUserId: 1, createdAt: -1 });

export default mongoose.model("SharedWorkout", sharedWorkoutSchema);
