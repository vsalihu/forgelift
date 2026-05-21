import mongoose from "mongoose";

const monthlyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    periodStart: Date,
    periodEnd: Date,
    title: { type: String, default: "" },
    summary: { type: String, default: "" },
    totalWorkouts: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    totalPRs: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    rankSummary: { type: Object, default: {} },
    bestExerciseImprovement: { type: Object, default: {} },
    bestMuscleProgress: { type: Object, default: {} },
    weakestArea: { type: String, default: "" },
    strongestArea: { type: String, default: "" },
    recoverySummary: { type: Object, default: {} },
    balanceSummary: { type: Object, default: {} },
    overloadSummary: { type: Object, default: {} },
    deloadSummary: { type: Object, default: {} },
    missionSummary: { type: Object, default: {} },
    insights: { type: [String], default: [] },
    nextMonthFocus: { type: [String], default: [] }
  },
  { timestamps: true }
);

monthlyReportSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("MonthlyReport", monthlyReportSchema);
