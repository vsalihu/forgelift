import dotenv from "dotenv";
import mongoose from "mongoose";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import Exercise from "../models/Exercise.js";
import Mission from "../models/Mission.js";
import MonthlyReport from "../models/MonthlyReport.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import { connectDB } from "../config/db.js";
import { calculateEstimated1RM } from "./calculateEstimated1RM.js";
import { calculateWorkoutStats } from "./calculateWorkoutStats.js";
import { recalculateUserRanks } from "./calculateRanks.js";

dotenv.config();

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const runSmokeTest = async () => {
  await connectDB();

  assert(typeof calculateEstimated1RM === "function", "calculateEstimated1RM did not import correctly.");
  assert(typeof calculateWorkoutStats === "function", "calculateWorkoutStats did not import correctly.");
  assert(typeof recalculateUserRanks === "function", "recalculateUserRanks did not import correctly.");

  const exerciseCount = await Exercise.countDocuments();
  assert(exerciseCount > 0, "No exercises found. Run npm run seed:exercises first.");

  const demoUser = await User.findOne({ email: "demo@forgelift.app" });
  assert(demoUser, "Demo user not found. Run npm run seed:demo first.");

  const [workoutCount, missionCount, reportCount, snapshotCount] = await Promise.all([
    Workout.countDocuments({ userId: demoUser._id }),
    Mission.countDocuments({ userId: demoUser._id }),
    MonthlyReport.countDocuments({ userId: demoUser._id }),
    AnalyticsSnapshot.countDocuments({ userId: demoUser._id })
  ]);

  assert(workoutCount >= 8, "Demo user has too few workouts.");
  assert(missionCount > 0, "Demo missions were not generated.");
  assert(reportCount > 0, "Demo monthly report was not generated.");
  assert(snapshotCount > 0, "Demo analytics snapshot was not generated.");

  console.log("Smoke test passed.");
  console.log(`Exercises: ${exerciseCount}`);
  console.log(`Demo workouts: ${workoutCount}`);
  console.log(`Demo missions: ${missionCount}`);
  console.log(`Demo reports: ${reportCount}`);
};

try {
  await runSmokeTest();
} catch (error) {
  console.error("Smoke test failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
