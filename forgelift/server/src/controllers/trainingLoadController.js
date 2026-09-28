import Workout from "../models/Workout.js";
import { recalculateTrainingLoadFromWorkouts } from "../utils/recalculateTrainingLoadFromWorkouts.js";

const getWorkoutHistory = (userId) => {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return Workout.find({ userId, date: { $gte: since } }).sort({ date: 1, createdAt: 1 });
};

export const getTrainingLoad = async (req, res) => {
  try {
    const workouts90d = await getWorkoutHistory(req.user._id);
    const trainingLoad = await recalculateTrainingLoadFromWorkouts({ user: req.user, workouts90d });
    return res.json({ trainingLoad });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch training load.", error: error.message });
  }
};
