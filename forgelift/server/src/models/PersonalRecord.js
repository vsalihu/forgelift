import mongoose from "mongoose";

const personalRecordSchema = new mongoose.Schema(
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
      trim: true
    },
    recordType: {
      type: String,
      enum: ["heaviest_weight", "best_estimated_1rm", "best_reps_at_weight", "best_volume"],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    weight: Number,
    reps: Number,
    volume: Number,
    estimated1RM: Number,
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      required: true
    },
    achievedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

personalRecordSchema.index({ userId: 1, exerciseId: 1, recordType: 1, achievedAt: -1 });

export default mongoose.model("PersonalRecord", personalRecordSchema);
