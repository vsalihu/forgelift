import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    done: { type: Boolean, default: false },
    // The meal's share of the day's targets when it was ticked, so totals don't shift later.
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  { _id: false }
);

// One per user per local day ("YYYY-MM-DD" in the user's own time zone).
const dailyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    checkIn: {
      at: Date,
      skipped: { type: Boolean, default: false },
      sleepHours: Number,
      energy: Number,
      // null: not said; the plan then uses logged or planned training.
      trainingToday: { type: Boolean, default: null },
      morningWeight: Number
    },
    // Amounts the user entered themselves; ticked meals and whey scoops are added on top.
    intake: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      waterMl: { type: Number, default: 0 }
    },
    meals: { type: [mealSchema], default: [] },
    // Doses taken per supplement key, e.g. { creatine: 2 }.
    supplements: { type: Object, default: {} },
    completion: {
      done: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  { timestamps: true, minimize: false }
);

dailyLogSchema.index({ userId: 1, day: 1 }, { unique: true });

export default mongoose.model("DailyLog", dailyLogSchema);
