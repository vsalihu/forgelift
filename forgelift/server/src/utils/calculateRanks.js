import MuscleRank from "../models/MuscleRank.js";
import PersonalRecord from "../models/PersonalRecord.js";
import Workout from "../models/Workout.js";
import { detectRankPromotions } from "./detectRankPromotions.js";
import {
  MUSCLE_GROUP_ALIASES,
  MUSCLE_GROUP_EXERCISES,
  MUSCLE_GROUPS,
  getMuscleGroupsForExercise
} from "./muscleGroupMappings.js";
import { getRankFromScore, getRankProgress } from "./rankConfig.js";
import { getBodyweightKg, getStrengthStandardTargets } from "./strengthStandards.js";

const roundScore = (value) => Math.round(Math.max(0, value || 0));
const roundOne = (value) => Math.round((value || 0) * 10) / 10;

const defaultWeighting = {
  strength: 0.45,
  volume: 0.25,
  consistency: 0.2,
  pr: 0.1
};

const goalWeightings = {
  "Strength Warrior": { strength: 0.6, volume: 0.15, consistency: 0.15, pr: 0.1 },
  "Muscle Builder": { strength: 0.3, volume: 0.4, consistency: 0.2, pr: 0.1 },
  "Fat Loss Fighter": { strength: 0.2, volume: 0.25, consistency: 0.45, pr: 0.1 },
  "Athletic Performance": { strength: 0.35, volume: 0.25, consistency: 0.3, pr: 0.1 },
  "Beginner Foundation": { strength: 0.25, volume: 0.25, consistency: 0.4, pr: 0.1 },
  "Balanced Beast": { strength: 0.35, volume: 0.3, consistency: 0.25, pr: 0.1 }
};

const getWeightingForGroup = (goalPath, muscleGroup) => {
  if (goalPath === "Glute Growth") {
    if (["Glutes", "Legs"].includes(muscleGroup)) {
      return { strength: 0.35, volume: 0.4, consistency: 0.15, pr: 0.1 };
    }

    return goalWeightings["Muscle Builder"];
  }

  return goalWeightings[goalPath] || defaultWeighting;
};

const getStrengthScoreForRatio = ({ ratio, targets }) => {
  if (!ratio || !targets) return 0;

  const ultimateTarget = targets[targets.length - 1];
  return Math.min(22000, (ratio / ultimateTarget) * 20000);
};

const getFallbackStrengthScore = (ratio) => Math.min(20000, ratio * 5000);

const workoutTrainsGroup = (workout, muscleGroup) => {
  const aliases = MUSCLE_GROUP_ALIASES[muscleGroup] || [muscleGroup];
  const groupExercises = MUSCLE_GROUP_EXERCISES[muscleGroup] || [];

  return workout.exercises?.some((exercise) => {
    const allMuscles = [
      ...(exercise.primaryMuscles || []),
      ...(exercise.secondaryMuscles || []),
      ...(exercise.stabiliserMuscles || [])
    ];

    return groupExercises.includes(exercise.exerciseName) || allMuscles.some((muscle) => aliases.includes(muscle));
  });
};

const calculateGroupLoad = (workout, muscleGroup) => {
  const aliases = MUSCLE_GROUP_ALIASES[muscleGroup] || [muscleGroup];

  return aliases.reduce((total, muscle) => {
    const load = workout.muscleLoadSummary?.[muscle];
    if (!load) return total;

    return total + (load.directLoad || 0) + (load.indirectLoad || 0) * 0.6 + (load.stabiliserLoad || 0) * 0.3;
  }, 0);
};

const getExerciseBestMap = (workouts) => {
  const bestMap = {};

  workouts.forEach((workout) => {
    workout.exercises?.forEach((exercise) => {
      const current = bestMap[exercise.exerciseName];
      const bestEstimated1RM = exercise.exerciseBestEstimated1RM || 0;

      if (!current || bestEstimated1RM > current.bestEstimated1RM) {
        bestMap[exercise.exerciseName] = {
          exerciseName: exercise.exerciseName,
          bestEstimated1RM
        };
      }
    });
  });

  return bestMap;
};

const calculateMuscleRank = ({ user, muscleGroup, workouts, personalRecords, exerciseBestMap }) => {
  const bodyweightKg = getBodyweightKg(user);
  const selectedStrengthStandard = user.selectedStrengthStandard || "neutral";
  const groupExercises = MUSCLE_GROUP_EXERCISES[muscleGroup] || [];
  const groupWorkouts = workouts.filter((workout) => workoutTrainsGroup(workout, muscleGroup));
  const totalVolume = groupWorkouts.reduce((total, workout) => total + calculateGroupLoad(workout, muscleGroup), 0);
  const now = Date.now();

  let strongestExercise = "";
  let bestEstimated1RM = 0;
  let strengthScore = 0;

  groupExercises.forEach((exerciseName) => {
    const exerciseBest = exerciseBestMap[exerciseName];
    const estimated1RM = exerciseBest?.bestEstimated1RM || 0;

    if (estimated1RM > bestEstimated1RM) {
      bestEstimated1RM = estimated1RM;
      strongestExercise = exerciseName;
    }

    if (estimated1RM && bodyweightKg) {
      const ratio = estimated1RM / bodyweightKg;
      const targets = getStrengthStandardTargets(selectedStrengthStandard, exerciseName);
      const exerciseScore = targets ? getStrengthScoreForRatio({ ratio, targets }) : getFallbackStrengthScore(ratio);
      strengthScore = Math.max(strengthScore, exerciseScore);
    }
  });

  const volumeScore = Math.min(20000, totalVolume / 5);
  const consistencyScore = Math.min(
    20000,
    groupWorkouts.reduce((score, workout) => {
      const daysOld = (now - new Date(workout.date).getTime()) / (1000 * 60 * 60 * 24);
      return score + (daysOld <= 30 ? 1200 : 600);
    }, 0)
  );
  const groupPrCount = personalRecords.filter((record) =>
    getMuscleGroupsForExercise(record.exerciseName).includes(muscleGroup)
  ).length;
  const prScore = Math.min(20000, groupPrCount * 1200);
  const weighting = getWeightingForGroup(user.goalPath, muscleGroup);
  const score = roundScore(
    strengthScore * weighting.strength +
      volumeScore * weighting.volume +
      consistencyScore * weighting.consistency +
      prScore * weighting.pr
  );
  const progress = getRankProgress(score);

  return {
    userId: user._id,
    muscleGroup,
    score,
    rank: progress.currentRank.name,
    progressPercentage: progress.progressPercentage,
    nextRank: progress.nextRank?.name || null,
    pointsToNextRank: progress.pointsToNextRank,
    strongestExercise,
    bestEstimated1RM: roundOne(bestEstimated1RM),
    totalVolume: roundOne(totalVolume),
    workoutCount: groupWorkouts.length,
    lastTrainedAt: groupWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date,
    dataAvailable: groupWorkouts.length > 0,
    confidence: groupWorkouts.length >= 3 ? "high" : groupWorkouts.length >= 1 ? "low" : "none",
    dataStatus: groupWorkouts.length >= 3 ? "sufficient_history" : groupWorkouts.length >= 1 ? "limited_history" : "unassessed"
  };
};

export const recalculateUserRanks = async (user) => {
  const [workouts, personalRecords, oldMuscleRankDocs] = await Promise.all([
    Workout.find({ userId: user._id }).sort({ date: -1, createdAt: -1 }),
    PersonalRecord.find({ userId: user._id }),
    MuscleRank.find({ userId: user._id })
  ]);

  const oldMuscleRanks = oldMuscleRankDocs.reduce((map, rank) => {
    map[rank.muscleGroup] = rank;
    return map;
  }, {});
  const oldOverallRank = user.currentOverallRank || "Copper";
  const exerciseBestMap = getExerciseBestMap(workouts);

  const muscleRanks = MUSCLE_GROUPS.map((muscleGroup) =>
    calculateMuscleRank({ user, muscleGroup, workouts, personalRecords, exerciseBestMap })
  );
  const trainedRanks = muscleRanks.filter((rank) => rank.workoutCount > 0);
  const averageMuscleScore = trainedRanks.length
    ? trainedRanks.reduce((total, rank) => total + rank.score, 0) / trainedRanks.length
    : 0;
  const xpContribution = Math.min(1000, (user.xp || 0) * 0.2);
  const overallScore = roundScore(averageMuscleScore + xpContribution);
  const overallProgress = getRankProgress(overallScore);

  await Promise.all(
    muscleRanks.map((rank) =>
      MuscleRank.findOneAndUpdate(
        { userId: user._id, muscleGroup: rank.muscleGroup },
        { $set: rank },
        { new: true, upsert: true }
      )
    )
  );

  user.overallRankScore = overallScore;
  user.currentOverallRank = overallProgress.currentRank.name;
  user.lastRankCheck = new Date();
  await user.save();

  const rankPromotions = detectRankPromotions({
    oldOverallRank,
    newOverallRank: user.currentOverallRank,
    oldMuscleRanks,
    newMuscleRanks: muscleRanks
  });

  return {
    overallRank: user.currentOverallRank,
    overallScore,
    overallProgress,
    xp: user.xp || 0,
    muscleRanks,
    rankPromotions
  };
};
