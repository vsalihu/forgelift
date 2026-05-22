import mongoose from "mongoose";

const tutorialProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    pageKey: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    skipped: {
      type: Boolean,
      default: false
    },
    dismissedUntil: Date,
    lastStep: {
      type: Number,
      default: 0
    },
    completedAt: Date,
    skippedAt: Date
  },
  { timestamps: true }
);

tutorialProgressSchema.index({ userId: 1, pageKey: 1 }, { unique: true });

export default mongoose.model("TutorialProgress", tutorialProgressSchema);
