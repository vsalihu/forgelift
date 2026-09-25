import mongoose from "mongoose";

const plannedExerciseSchema = new mongoose.Schema(
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
    }
  },
  { _id: false }
);

const calendarEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ["rest", "treatment", "planned_workout"],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    source: {
      type: String,
      enum: ["manual", "generated"],
      default: "manual"
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPlan"
    },
    isDeloadWeek: {
      type: Boolean,
      default: false
    },
    workoutTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutTemplate"
    },
    plannedTitle: {
      type: String,
      trim: true,
      default: ""
    },
    plannedExercises: {
      type: [plannedExerciseSchema],
      default: []
    },
    muscleGroups: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

calendarEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
calendarEntrySchema.index({ userId: 1, planId: 1 });

export default mongoose.model("CalendarEntry", calendarEntrySchema);
