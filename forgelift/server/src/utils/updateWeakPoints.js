import MuscleRank from "../models/MuscleRank.js";
import PersonalRecord from "../models/PersonalRecord.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { calculateTrainingBalance } from "./calculateTrainingBalance.js";
import { detectWeakPoints } from "./detectWeakPoints.js";
import { recalculateUserRanks } from "./calculateRanks.js";

const getRecentWorkouts = (userId) => {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  return Workout.find({ userId, date: { $gte: since } }).sort({ date: -1, createdAt: -1 });
};

export const updateWeakPoints = async (user) => {
  const workouts = await getRecentWorkouts(user._id);
  let muscleRanks = await MuscleRank.find({ userId: user._id });

  if (!muscleRanks.length && workouts.length) {
    const rankData = await recalculateUserRanks(user);
    muscleRanks = rankData.muscleRanks;
  }

  const personalRecords = await PersonalRecord.find({ userId: user._id });
  const balanceData = calculateTrainingBalance({ user, workouts, muscleRanks });
  const trainingBalance = await TrainingBalance.findOneAndUpdate(
    { userId: user._id },
    { $set: { userId: user._id, ...balanceData } },
    { new: true, upsert: true, sort: { updatedAt: -1 } }
  );
  const weakPoints = detectWeakPoints({ user, workouts, muscleRanks, trainingBalance, personalRecords });

  await WeakPoint.updateMany({ userId: user._id, active: true }, { $set: { active: false } });

  const savedWeakPoints = weakPoints.length
    ? await WeakPoint.insertMany(weakPoints.map((weakPoint) => ({ userId: user._id, ...weakPoint })))
    : [];

  return {
    trainingBalance,
    weakPoints: savedWeakPoints
  };
};
