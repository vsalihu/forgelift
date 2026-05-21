import mongoose from "mongoose";

const workoutTemplateExerciseSchema = new mongoose.Schema(
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
    targetSets: {
      type: Number,
      default: 3
    },
    targetRepMin: {
      type: Number,
      default: 8
    },
    targetRepMax: {
      type: Number,
      default: 12
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const workoutTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    goalPath: {
      type: String,
      default: ""
    },
    exercises: {
      type: [workoutTemplateExerciseSchema],
      default: []
    }
  },
  { timestamps: true }
);

workoutTemplateSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("WorkoutTemplate", workoutTemplateSchema);
