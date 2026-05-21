import OverloadRecommendation from "../models/OverloadRecommendation.js";
import Workout from "../models/Workout.js";
import { updateOverloadRecommendations } from "../utils/updateOverloadRecommendations.js";

const allowedStatuses = ["active", "completed", "ignored", "expired"];

export const getOverloadRecommendations = async (req, res) => {
  try {
    const recommendations = await OverloadRecommendation.find({
      userId: req.user._id,
      status: req.query.status || "active"
    }).sort({ createdAt: -1 });
    const workoutExerciseNames = await Workout.distinct("exercises.exerciseName", { userId: req.user._id });
    const realHistorySet = new Set(workoutExerciseNames);
    const baselineRecommendations = (req.user.strengthBaselines || [])
      .filter((baseline) => baseline.source === "estimated_from_baseline" && !realHistorySet.has(baseline.exerciseName))
      .map((baseline) => ({
        exerciseName: baseline.exerciseName,
        recommendationType: "baseline_start",
        currentWeight: 0,
        recommendedWeight: baseline.suggestedWorkingWeight || baseline.workingWeight || 0,
        recommendedRepTarget: baseline.suggestedRepRange || `${baseline.reps || 8} reps`,
        confidence: baseline.confidence || "Low",
        reason: `Starting estimate, not overload recommendation. No workout history for ${baseline.exerciseName}. Based on your ${baseline.sourceExerciseName} baseline, a conservative starting point is ${baseline.suggestedWorkingWeight || baseline.workingWeight || 0}kg for ${baseline.suggestedRepRange || "controlled reps"}. Adjust after your first real session.`,
        warnings: ["Estimated baseline only. Do not treat this as guaranteed performance."],
        muscleGroups: [],
        source: "strength_baseline",
        dataStatus: "baseline_only",
        isEstimate: true
      }));

    return res.json({ recommendations, baselineRecommendations });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch overload recommendations.", error: error.message });
  }
};

export const getExerciseOverloadRecommendation = async (req, res) => {
  try {
    const exerciseName = decodeURIComponent(req.params.exerciseName);
    const history = await OverloadRecommendation.find({
      userId: req.user._id,
      exerciseName
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      latestRecommendation: history[0] || null,
      history
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch exercise recommendation.", error: error.message });
  }
};

export const recalculateOverloadRecommendations = async (req, res) => {
  try {
    const latestWorkout = await Workout.findOne({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });

    if (!latestWorkout) {
      return res.json({
        recommendations: [],
        message: "No workouts found. Log workouts to generate next-session targets."
      });
    }

    const recommendations = await updateOverloadRecommendations({ user: req.user, workout: latestWorkout });
    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate overload recommendations.", error: error.message });
  }
};

export const updateOverloadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid recommendation status." });
    }

    const recommendation = await OverloadRecommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ message: "Overload recommendation not found." });
    }

    return res.json({ recommendation });
  } catch (error) {
    return res.status(404).json({ message: "Overload recommendation not found.", error: error.message });
  }
};
