import { getWeeklyMuscleCoverage } from "./getWeeklyMuscleCoverage.js";
import { GROUP_LABELS, WORKOUT_TYPES } from "./workoutTypeConfig.js";

const RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const getScore = (scoresByMuscle, muscle) => scoresByMuscle[muscle]?.score;

const averageKnownRecovery = (scoresByMuscle, muscles = []) => {
  const knownScores = muscles
    .map((muscle) => getScore(scoresByMuscle, muscle))
    .filter((score) => score !== undefined && score !== null);

  if (!knownScores.length) return null;
  return knownScores.reduce((total, score) => total + Number(score), 0) / knownScores.length;
};

const hasLowRecovery = (scoresByMuscle, muscles = [], threshold) =>
  muscles.some((muscle) => {
    const score = getScore(scoresByMuscle, muscle);
    return score !== undefined && score !== null && score < threshold;
  });

const getLowRecoveryMuscles = (scoresByMuscle, muscles = [], threshold) =>
  muscles.filter((muscle) => {
    const score = getScore(scoresByMuscle, muscle);
    return score !== undefined && score !== null && score < threshold;
  });

const daysSince = (date) => {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
};

const getLastWorkoutType = (workout) => {
  if (!workout?.muscleLoadSummary) return "";

  const groupLoads = {
    "Push Day": ["Chest", "Upper Chest", "Shoulders", "Front Shoulders", "Triceps"],
    "Pull Day": ["Back", "Upper Back", "Rear Shoulders", "Biceps", "Grip"],
    "Leg Day": ["Legs", "Quads", "Glutes", "Hamstrings", "Calves"]
  };

  const scoredTypes = Object.entries(groupLoads)
    .map(([type, muscles]) => ({
      type,
      load: muscles.reduce((total, muscle) => {
        const load = workout.muscleLoadSummary[muscle] || {};
        return total + (load.directLoad || 0) + (load.indirectLoad || 0) * 0.5 + (load.stabiliserLoad || 0) * 0.25;
      }, 0)
    }))
    .sort((a, b) => b.load - a.load);

  return scoredTypes[0]?.load > 0 ? scoredTypes[0].type : "";
};

const hasMissionTarget = (activeMissions = [], workoutType) => {
  const missionText = activeMissions
    .map((mission) => `${mission.title || ""} ${mission.description || ""} ${(mission.targetMuscleGroups || []).join(" ")}`)
    .join(" ")
    .toLowerCase();

  const checks = {
    "Push Day": ["push", "chest", "shoulder", "tricep"],
    "Pull Day": ["pull", "back", "rear shoulder", "bicep"],
    "Leg Day": ["leg", "quad", "calf", "lower"],
    "Glute/Lower Body": ["glute", "hamstring", "lower"],
    "Core + Conditioning": ["core", "conditioning", "cardio"],
    "Full Body": ["full body", "whole body"]
  };

  return (checks[workoutType] || []).some((term) => missionText.includes(term));
};

const hasActiveDeloadForType = (activeDeloads = [], workoutType) => {
  if (!activeDeloads.length) return false;
  if (activeDeloads.some((deload) => deload.scope === "full_body")) return true;

  const type = WORKOUT_TYPES.find((item) => item.name === workoutType);
  return activeDeloads.some((deload) => {
    const target = deload.muscleGroup || deload.exerciseName || "";
    return type?.muscles?.some((muscle) => target.toLowerCase().includes(muscle.toLowerCase()));
  });
};

const addReason = (reasons, reason) => {
  if (reason && !reasons.includes(reason)) reasons.push(reason);
};

const groupVerb = (label) => (["Legs", "Glutes", "Hamstrings"].includes(label) ? "have" : "has");

const scoreWorkoutType = ({
  type,
  scoresByMuscle,
  coverage,
  trainingBalance,
  user,
  recentWorkouts,
  activeDeloads,
  activeMissions
}) => {
  const reasons = [];
  let score = 0;

  if (type.name === "Rest / Mobility") {
    const trackedScores = Object.values(scoresByMuscle).map((item) => item.score).filter((item) => item !== null && item !== undefined);
    const poorCount = trackedScores.filter((item) => item < 50).length;
    score = poorCount >= Math.max(2, trackedScores.length * 0.5) ? 80 : -20;
    if (score > 0) addReason(reasons, "Several tracked muscles have low recovery.");
    return { workoutType: type.name, score, reasons };
  }

  const lowSafetyMuscles = getLowRecoveryMuscles(scoresByMuscle, type.muscles, 40);
  if (lowSafetyMuscles.length) {
    score -= 100;
    addReason(reasons, `${lowSafetyMuscles.slice(0, 2).join(", ")} recovery is below the safe threshold.`);
  }

  if (hasActiveDeloadForType(activeDeloads, type.name)) {
    score -= 80;
    addReason(reasons, "Active deload overlaps this workout type.");
  }

  type.mainGroups.forEach((group) => {
    const label = GROUP_LABELS[group] || group;
    if (coverage.missingGroups.includes(group)) {
      score += user?.goalPath === "Balanced Beast" ? 65 : 50;
      addReason(reasons, `${label} ${groupVerb(label)} not been trained this week.`);
    }

    if (coverage.undertrainedGroups.includes(group)) {
      score += user?.goalPath === "Muscle Builder" ? 45 : 35;
      addReason(reasons, `${label} is undertrained this week.`);
    }

    const lastTrained = coverage.lastTrainedAtByGroup[group];
    const gap = daysSince(lastTrained);
    if (lastTrained && gap >= 14) {
      score += 70;
      addReason(reasons, `${label} has not been trained in 14+ days.`);
    } else if (lastTrained && gap >= RECENT_DAYS) {
      score += 45;
      addReason(reasons, `${label} has not been trained in 7+ days.`);
    }
  });

  if (trainingBalance?.upperLowerRatio > 1.4) {
    if (type.name === "Leg Day") {
      score += 60;
      addReason(reasons, "Upper-body volume is ahead of lower-body work.");
    }
    if (type.name === "Glute/Lower Body") {
      score += 50;
      addReason(reasons, "Lower body needs more coverage for training balance.");
    }
    if (["Push Day", "Pull Day"].includes(type.name)) {
      score -= 20;
      addReason(reasons, "Upper body is already ahead of lower body.");
    }
  }

  if (trainingBalance?.pushPullRatio > 1.25) {
    if (type.name === "Pull Day") {
      score += 50;
      addReason(reasons, "Push volume is higher than pull volume.");
    }
    if (type.name === "Push Day") {
      score -= 30;
      addReason(reasons, "Push volume is already high.");
    }
  } else if (trainingBalance?.pushPullRatio < 0.8) {
    if (type.name === "Push Day") {
      score += 35;
      addReason(reasons, "Pull volume is ahead of push volume.");
    }
  }

  if (trainingBalance?.frontRearRatio > 1.3) {
    if (["Pull Day", "Glute/Lower Body"].includes(type.name)) {
      score += 30;
      addReason(reasons, "Rear-chain work helps correct front/rear balance.");
    }
  }

  if (user?.goalPath === "Glute Growth" && type.name === "Glute/Lower Body" && !hasLowRecovery(scoresByMuscle, type.muscles, 60)) {
    score += 35;
    addReason(reasons, "Glute Growth goal benefits from lower-body and glute-focused work.");
  }
  if (user?.goalPath === "Fat Loss Fighter" && ["Full Body", "Core + Conditioning"].includes(type.name)) {
    score += 20;
    addReason(reasons, "Fat Loss Fighter benefits from consistent full-body or conditioning work.");
  }
  if (user?.goalPath === "Beginner Foundation" && type.name === "Full Body") {
    score += 20;
    addReason(reasons, "Beginner Foundation favors balanced, moderate sessions.");
  }

  const averageRecovery = averageKnownRecovery(scoresByMuscle, type.muscles);
  if (averageRecovery >= 80) {
    score += 20;
    addReason(reasons, "Main muscles look recovered enough.");
  } else if (averageRecovery >= 60) {
    score += 10;
    addReason(reasons, "Main muscles have acceptable recovery.");
  } else if (averageRecovery !== null && averageRecovery < 60) {
    score -= 25;
    addReason(reasons, "Some main muscles are still recovering.");
  }

  const lastWorkoutType = getLastWorkoutType(recentWorkouts[0]);
  if (lastWorkoutType === type.name) {
    const stillUndertrained = type.mainGroups.some((group) => coverage.undertrainedGroups.includes(group) || coverage.missingGroups.includes(group));
    if (!stillUndertrained) {
      score -= 30;
      addReason(reasons, "Avoid repeating the same workout style as last session.");
    }
  }

  if (hasMissionTarget(activeMissions, type.name)) {
    score += 25;
    addReason(reasons, "This aligns with an active weekly mission.");
  }

  return { workoutType: type.name, score: Math.round(score), reasons };
};

export const generateTodayRecommendation = ({
  user,
  recoveryScores = [],
  recentWorkouts = [],
  currentWeekWorkouts = [],
  trainingBalance = null,
  activeDeloads = [],
  activeMissions = []
} = {}) => {
  const usableScores = recoveryScores.filter((score) => score.dataAvailable !== false && score.score !== null && score.score !== undefined);
  const scoresByMuscle = usableScores.reduce((map, score) => {
    map[score.muscleGroup] = score;
    return map;
  }, {});

  const coverage = getWeeklyMuscleCoverage({ user, workouts: currentWeekWorkouts });
  const workoutCount = recentWorkouts.length;

  if (!workoutCount) {
    return {
      bestWorkoutType: "Beginner Full Body",
      bestMusclesToTrain: [],
      carefulMuscles: [],
      musclesToAvoid: [],
      balanceReason: "Not enough workout history yet.",
      recoveryReason: "Recovery recommendations unlock after you log workouts.",
      missingGroups: coverage.missingGroups,
      undertrainedGroups: coverage.undertrainedGroups,
      scoreBreakdown: [],
      reasons: ["Not enough workout history yet. Start with a beginner full-body session or complete your assessment."]
    };
  }

  const scoreBreakdown = WORKOUT_TYPES.map((type) =>
    scoreWorkoutType({
      type,
      scoresByMuscle,
      coverage,
      trainingBalance,
      user,
      recentWorkouts,
      activeDeloads,
      activeMissions
    })
  ).sort((a, b) => b.score - a.score);

  const best = scoreBreakdown[0] || { workoutType: "Full Body", reasons: [] };
  const selectedType = WORKOUT_TYPES.find((type) => type.name === best.workoutType);
  const bestMusclesToTrain = selectedType?.muscles || [];
  const carefulMuscles = usableScores
    .filter((score) => score.score >= 40 && score.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((score) => score.muscleGroup);
  const musclesToAvoid = usableScores
    .filter((score) => score.score < 40)
    .sort((a, b) => a.score - b.score)
    .map((score) => score.muscleGroup);

  const reasons = [...best.reasons];
  if (workoutCount === 1) {
    addReason(reasons, "ForgeLift is still learning. Training a different major muscle group helps build balance.");
  }
  if (coverage.missingGroups.includes("legs") || coverage.missingGroups.includes("glutes") || coverage.missingGroups.includes("hamstrings")) {
    addReason(reasons, "No lower-body work is logged this week.");
  }
  if (usableScores.length) {
    addReason(reasons, "Recovery is used as a safety check, then balance decides the smartest session.");
  }

  return {
    bestWorkoutType: best.workoutType,
    bestMusclesToTrain: bestMusclesToTrain.slice(0, 6),
    carefulMuscles: carefulMuscles.slice(0, 6),
    musclesToAvoid: musclesToAvoid.slice(0, 6),
    balanceReason: coverage.missingGroups.length
      ? `${coverage.missingGroups.map((group) => GROUP_LABELS[group] || group).join(", ")} missing from this week.`
      : "Weekly coverage is present, so balance is using volume ratios and goal path.",
    recoveryReason: usableScores.length
      ? "Recovery blocked unsafe options and modified the final score."
      : "No useful recovery scores yet, so the recommendation leans on training coverage.",
    missingGroups: coverage.missingGroups,
    undertrainedGroups: coverage.undertrainedGroups,
    scoreBreakdown,
    reasons: reasons.slice(0, 6)
  };
};
