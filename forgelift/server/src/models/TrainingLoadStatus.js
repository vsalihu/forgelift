import mongoose from "mongoose";

const trainingLoadStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    muscleGroup: {
      type: String,
      required: true
    },
    acuteLoad: {
      type: Number,
      default: 0
    },
    chronicLoad: {
      type: Number,
      default: 0
    },
    acwr: {
      type: Number,
      default: null
    },
    acwrStatus: {
      type: String,
      enum: ["No Data", "Undertraining", "Sweet Spot", "Caution", "High Risk"],
      default: "No Data"
    },
    strengthTrendPercent: {
      type: Number,
      default: null
    },
    strengthDirection: {
      type: String,
      enum: ["No Data", "Rising", "Stable", "Declining"],
      default: "No Data"
    },
    quadrant: {
      type: String,
      enum: ["Not Enough Data", "Real Progress", "Overreaching", "Fatigued Without Gains", "Detraining", "Maintaining"],
      default: "Not Enough Data"
    },
    confidence: {
      type: String,
      enum: ["none", "medium", "high"],
      default: "none"
    },
    dataAvailable: {
      type: Boolean,
      default: false
    },
    summary: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

trainingLoadStatusSchema.index({ userId: 1, muscleGroup: 1 }, { unique: true });

export default mongoose.model("TrainingLoadStatus", trainingLoadStatusSchema);
