import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Exercise from "../models/Exercise.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import RecoveryScore from "../models/RecoveryScore.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { detectFatigueAccumulation } from "./detectFatigueAccumulation.js";
import { detectPlateaus } from "./detectPlateaus.js";
import {
  generateExerciseDeloadRecommendation,
  generateFullBodyDeloadRecommendation,
  generateMuscleDeloadRecommendation
} from "./generateDeloadRecommendation.js";

const severityRank = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

const getRecentWorkouts = (userId) => {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  return Workout.find({ userId, date: { $gte: since } }).sort({ date: -1, createdAt: -1 });
};

const getRecommendationKey = (recommendation) =>
  [recommendation.scope, recommendation.exerciseName || "", recommendation.muscleGroup || "", recommendation.recommendationType].join(":");

export const buildDeloadSignals = async (user) => {
  const workouts = await getRecentWorkouts(user._id);
  const [recoveryScores, overloadRecommendations, weakPoints, trainingBalance] = await Promise.all([
    RecoveryScore.find({ userId: user._id }),
    OverloadRecommendation.find({ userId: user._id, status: "active" }),
    WeakPoint.find({ userId: user._id, active: true }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 })
  ]);

  const plateauSummary = detectPlateaus({ user, workouts });
  const fatigueSummary = detectFatigueAccumulation({
    user,
    workouts,
    recoveryScores,
    overloadRecommendations,
    weakPoints,
    trainingBalance
  });

  return {
    workouts,
    recoveryScores,
    overloadRecommendations,
    weakPoints,
    trainingBalance,
    plateauSummary,
    fatigueSummary
  };
};

export const updateDeloadRecommendations = async (user) => {
  const {
    workouts,
    recoveryScores,
    overloadRecommendations,
    weakPoints,
    trainingBalance,
    plateauSummary,
    fatigueSummary
  } = await buildDeloadSignals(user);

  if (!workouts.length) {
    await DeloadRecommendation.updateMany({ userId: user._id, status: "active" }, { $set: { status: "expired" } });
    return { plateauSummary: [], fatigueSummary, deloadRecommendations: [] };
  }

  const exerciseDocs = await Exercise.find({
    name: { $in: plateauSummary.map((plateau) => plateau.exerciseName) }
  });
  const exerciseMap = new Map(exerciseDocs.map((exercise) => [exercise.name, exercise]));
  const recommendations = [];

  plateauSummary
    .filter((plateau) => severityRank[plateau.severity] >= severityRank.Medium)
    .forEach((plateau) => {
      recommendations.push(
        generateExerciseDeloadRecommendation({
          plateau,
          exercise: exerciseMap.get(plateau.exerciseName)
        })
      );
    });

  const affectedMuscles = new Set(fatigueSummary.affectedMuscles || []);
  recoveryScores
    .filter((score) => score.score < 50)
    .forEach((score) => affectedMuscles.add(score.muscleGroup));

  if (["Medium", "High", "Critical"].includes(fatigueSummary.fatigueLevel)) {
    [...affectedMuscles].slice(0, 6).forEach((muscleGroup) => {
      recommendations.push(
        generateMuscleDeloadRecommendation({
          muscleGroup,
          fatigueData: fatigueSummary,
          recoveryScore: recoveryScores.find((score) => score.muscleGroup === muscleGroup)
        })
      );
    });
  }

  if (["High", "Critical"].includes(fatigueSummary.fatigueLevel) && (fatigueSummary.affectedMuscles || []).length >= 4) {
    recommendations.push(generateFullBodyDeloadRecommendation({ fatigueData: fatigueSummary }));
  }

  const uniqueRecommendations = [...new Map(recommendations.map((recommendation) => [getRecommendationKey(recommendation), recommendation])).values()];

  await DeloadRecommendation.updateMany({ userId: user._id, status: "active" }, { $set: { status: "expired" } });

  const deloadRecommendations = uniqueRecommendations.length
    ? await DeloadRecommendation.insertMany(
        uniqueRecommendations.map((recommendation) => ({
          userId: user._id,
          ...recommendation,
          status: "active"
        }))
      )
    : [];

  return {
    plateauSummary,
    fatigueSummary,
    deloadRecommendations,
    context: {
      overloadRecommendationCount: overloadRecommendations.length,
      weakPointCount: weakPoints.length,
      trainingBalanceScore: trainingBalance?.score
    }
  };
};
