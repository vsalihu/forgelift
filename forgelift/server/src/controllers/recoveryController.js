import RecoveryScore from "../models/RecoveryScore.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Mission from "../models/Mission.js";
import TrainingBalance from "../models/TrainingBalance.js";
import Workout from "../models/Workout.js";
import { generateTodayRecommendation } from "../utils/generateTodayRecommendation.js";
import { recalculateRecoveryFromWorkouts } from "../utils/recalculateRecoveryFromWorkouts.js";

const getRecentWorkouts = (userId) => {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  return Workout.find({ userId, date: { $gte: since } }).sort({ date: -1, createdAt: -1 });
};

const getCurrentWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const buildTodayRecommendation = async ({ user, recoveryScores, recentWorkouts }) => {
  const weekStart = getCurrentWeekStart();
  const now = new Date();
  const [currentWeekWorkouts, trainingBalance, activeDeloads, activeMissions] = await Promise.all([
    Workout.find({ userId: user._id, date: { $gte: weekStart, $lte: now } }).sort({ date: -1, createdAt: -1 }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 }),
    DeloadRecommendation.find({ userId: user._id, status: "active" }),
    Mission.find({ userId: user._id, status: "active", startDate: { $lte: now }, endDate: { $gte: now } })
  ]);

  return generateTodayRecommendation({
    user,
    recoveryScores,
    recentWorkouts,
    currentWeekWorkouts,
    trainingBalance,
    activeDeloads,
    activeMissions
  });
};

const recalculateForUser = async (user) => {
  const recentWorkouts = await getRecentWorkouts(user._id);
  return recalculateRecoveryFromWorkouts({ user, recentWorkouts });
};

export const getRecoveryScores = async (req, res) => {
  try {
    const recoveryScores = await recalculateForUser(req.user);
    return res.json({ recoveryScores });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch recovery scores.", error: error.message });
  }
};

export const recalculateRecovery = async (req, res) => {
  try {
    const recoveryScores = await recalculateForUser(req.user);
    const recentWorkouts = await getRecentWorkouts(req.user._id);
    const todayRecommendation = await buildTodayRecommendation({ user: req.user, recoveryScores, recentWorkouts });
    return res.json({ recoveryScores, todayRecommendation });
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate recovery.", error: error.message });
  }
};

export const getMuscleRecovery = async (req, res) => {
  try {
    await recalculateForUser(req.user);
    const muscleGroup = decodeURIComponent(req.params.muscleGroup);
    const recoveryScore = await RecoveryScore.findOne({ userId: req.user._id, muscleGroup });

    if (!recoveryScore) {
      return res.status(404).json({ message: "Recovery score not found." });
    }

    return res.json({ recoveryScore });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch muscle recovery.", error: error.message });
  }
};

export const getTodayRecommendation = async (req, res) => {
  try {
    const recoveryScores = await recalculateForUser(req.user);
    const recentWorkouts = await getRecentWorkouts(req.user._id);
    const todayRecommendation = await buildTodayRecommendation({ user: req.user, recoveryScores, recentWorkouts });
    return res.json({ todayRecommendation, recoveryScores });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch today's recommendation.", error: error.message });
  }
};
