import mongoose from "mongoose";

const trainingBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    score: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ["Not enough data", "Excellent", "Good", "Needs Work", "Poor"],
      default: "Not enough data"
    },
    confidence: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none"
    },
    dataStatus: {
      type: String,
      enum: ["no_data", "limited_history", "sufficient_history"],
      default: "no_data"
    },
    minimumDataMet: {
      type: Boolean,
      default: false
    },
    pushPullRatio: {
      type: Number,
      default: 1
    },
    upperLowerRatio: {
      type: Number,
      default: 1
    },
    frontRearRatio: {
      type: Number,
      default: 1
    },
    directIndirectRatio: {
      type: Number,
      default: 1
    },
    coreFrequencyScore: {
      type: Number,
      default: 100
    },
    gluteHamstringScore: {
      type: Number,
      default: 100
    },
    weakestAreas: {
      type: [String],
      default: []
    },
    strongestAreas: {
      type: [String],
      default: []
    },
    warnings: {
      type: [String],
      default: []
    },
    recommendations: {
      type: [String],
      default: []
    },
    volumeBreakdown: {
      type: Object,
      default: {}
    },
    calculatedFrom: Date,
    calculatedTo: Date
  },
  { timestamps: true }
);

trainingBalanceSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("TrainingBalance", trainingBalanceSchema);
