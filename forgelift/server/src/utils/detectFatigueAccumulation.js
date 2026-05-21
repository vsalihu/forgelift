import { getLoadLevel } from "./getLoadLevel.js";

const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const getWeightedLoad = (load = {}) =>
  (Number(load.directLoad) || 0) + (Number(load.indirectLoad) || 0) * 0.5 + (Number(load.stabiliserLoad) || 0) * 0.25;

const getLevelRank = (level) => ({ Low: 1, Medium: 2, High: 3, "Very High": 4 })[level] || 1;

export const detectFatigueAccumulation = ({
  workouts = [],
  recoveryScores = [],
  overloadRecommendations = [],
  trainingBalance
}) => {
  const last14 = workouts.filter((workout) => new Date(workout.date) >= daysAgo(14));
  const last7 = workouts.filter((workout) => new Date(workout.date) >= daysAgo(7));
  const previous7 = workouts.filter((workout) => {
    const date = new Date(workout.date);
    return date < daysAgo(7) && date >= daysAgo(14);
  });
  const reasons = [];
  const affectedMuscles = new Set();
  const evidence = {};

  const highRpeSessions = last14.filter((workout) => (Number(workout.sessionRPE) || 0) >= 9).length;
  if (highRpeSessions >= 3) {
    reasons.push(`${highRpeSessions} sessions reached session RPE 9 or higher in the last 14 days.`);
    evidence.highRpeSessions = highRpeSessions;
  }

  const lowRecoveryScores = recoveryScores.filter((score) => (Number(score.score) || 100) < 50);
  if (lowRecoveryScores.length) {
    lowRecoveryScores.forEach((score) => affectedMuscles.add(score.muscleGroup));
    reasons.push(`${lowRecoveryScores.length} muscle group${lowRecoveryScores.length === 1 ? " is" : "s are"} below 50% recovery.`);
    evidence.lowRecoveryMuscles = lowRecoveryScores.map((score) => ({
      muscleGroup: score.muscleGroup,
      score: score.score
    }));
  }

  const last7Volume = last7.reduce((total, workout) => total + (Number(workout.totalVolume) || 0), 0);
  const previous7Volume = previous7.reduce((total, workout) => total + (Number(workout.totalVolume) || 0), 0);
  if (previous7Volume > 0 && last7Volume >= previous7Volume * 1.3) {
    reasons.push("Training volume is more than 30% higher than the previous 7-day block.");
    evidence.volumeSpike = {
      last7Volume: roundOne(last7Volume),
      previous7Volume: roundOne(previous7Volume)
    };
  }

  const failedSetsLast7 = last7.reduce((total, workout) => total + (Number(workout.failedSetCount) || 0), 0);
  const failedSetsPrevious7 = previous7.reduce((total, workout) => total + (Number(workout.failedSetCount) || 0), 0);
  if (failedSetsLast7 >= 2 && failedSetsLast7 > failedSetsPrevious7) {
    reasons.push("Failed sets are increasing in the last 7 days.");
    evidence.failedSetTrend = { failedSetsLast7, failedSetsPrevious7 };
  }

  const highLoadFrequency = {};
  last7.forEach((workout) => {
    Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
      const level = getLevelRank(getLoadLevel(load.directLoad || 0));
      if (level >= 3) {
        highLoadFrequency[muscle] = (highLoadFrequency[muscle] || 0) + 1;
      }
    });
  });

  Object.entries(highLoadFrequency).forEach(([muscle, count]) => {
    if (count > 3) {
      affectedMuscles.add(muscle);
      reasons.push(`${muscle} received high direct load more than 3 times in the last 7 days.`);
    }
  });
  evidence.highLoadFrequency = highLoadFrequency;

  const activeDeloadFlags = overloadRecommendations.filter((recommendation) =>
    ["deload_flag", "plateau_warning", "recovery_warning"].includes(recommendation.recommendationType)
  );
  if (activeDeloadFlags.length >= 2) {
    activeDeloadFlags.forEach((recommendation) => {
      (recommendation.muscleGroups || []).forEach((muscle) => affectedMuscles.add(muscle));
    });
    reasons.push("Multiple active overload warnings are present.");
    evidence.overloadWarnings = activeDeloadFlags.map((recommendation) => ({
      exerciseName: recommendation.exerciseName,
      recommendationType: recommendation.recommendationType
    }));
  }

  if (trainingBalance?.score !== undefined && trainingBalance.score < 50) {
    reasons.push("Training balance is poor, which can contribute to fatigue accumulation.");
    evidence.trainingBalance = {
      score: trainingBalance.score,
      status: trainingBalance.status
    };
  }

  const manyMajorMusclesLow = lowRecoveryScores.length >= 4;
  const score = reasons.length + (manyMajorMusclesLow ? 2 : 0) + (highRpeSessions >= 3 ? 1 : 0);
  let fatigueLevel = "Low";
  if (score >= 6) fatigueLevel = "Critical";
  else if (score >= 4) fatigueLevel = "High";
  else if (score >= 2) fatigueLevel = "Medium";

  if (manyMajorMusclesLow) {
    reasons.push("Several major muscle groups are below 50% recovery, suggesting full-body fatigue.");
  }

  return {
    fatigueLevel,
    affectedMuscles: [...affectedMuscles],
    reasons,
    evidence: {
      ...evidence,
      last7Volume: roundOne(last7Volume),
      previous7Volume: roundOne(previous7Volume),
      recentWorkoutCount: last14.length
    }
  };
};
