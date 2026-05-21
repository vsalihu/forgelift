import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ["completed", "skipped"],
      required: true
    },
    answers: {
      type: Object,
      default: {}
    },
    calculatedLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"]
    },
    confidence: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    strengthBaselinesCreated: {
      type: [Object],
      default: []
    },
    estimatedRankPreview: {
      type: Object,
      default: {}
    },
    recommendations: {
      type: [String],
      default: []
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

assessmentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Assessment", assessmentSchema);
