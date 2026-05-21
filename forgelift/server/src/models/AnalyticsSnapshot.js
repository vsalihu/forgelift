import mongoose from "mongoose";

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    periodType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    totalWorkouts: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    totalReps: { type: Number, default: 0 },
    averageSessionRPE: { type: Number, default: 0 },
    totalPRs: { type: Number, default: 0 },
    totalMissionsCompleted: { type: Number, default: 0 },
    averageRecoveryScore: { type: Number, default: 0 },
    averageTrainingBalanceScore: { type: Number, default: 0 },
    topExercises: { type: [Object], default: [] },
    topMusclesByLoad: { type: [Object], default: [] },
    strengthHighlights: { type: [Object], default: [] },
    rankChanges: { type: [Object], default: [] },
    weakPointChanges: { type: [Object], default: [] },
    recommendations: { type: [String], default: [] }
  },
  { timestamps: true }
);

analyticsSnapshotSchema.index({ userId: 1, periodType: 1, periodStart: 1, periodEnd: 1 });

export default mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
