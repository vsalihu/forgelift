import mongoose from "mongoose";

const trainingPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    durationWeeks: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active"
    },
    splitSummary: {
      type: String,
      trim: true,
      default: ""
    },
    workoutsPerWeek: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

trainingPlanSchema.index({ userId: 1, status: 1 });

export default mongoose.model("TrainingPlan", trainingPlanSchema);
