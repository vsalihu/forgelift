import { getLoadLevel } from "./getLoadLevel.js";

const clamp = (value) => Math.min(100, Math.max(0, Math.round(value)));

const hoursBetween = (date, now = new Date()) => {
  if (!date) return 999;
  return Math.max(0, (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
};

const fatigueByLoadLevel = {
  directLoad: { Low: 10, Medium: 20, High: 35, "Very High": 50 },
  indirectLoad: { Low: 5, Medium: 12, High: 22, "Very High": 35 },
  stabiliserLoad: { Low: 3, Medium: 8, High: 15, "Very High": 25 }
};

const getStatus = (score) => {
  if (score >= 80) return "Fully Recovered";
  if (score >= 60) return "Mostly Ready";
  if (score >= 40) return "Not Fully Recovered";
  return "Poor Recovery";
};

const getRestRecommendationHours = (score) => {
  if (score >= 90) return 0;
  if (score >= 80) return 6;
  if (score >= 70) return 12;
  if (score >= 60) return 18;
  if (score >= 50) return 24;
  if (score >= 40) return 36;
  if (score >= 30) return 48;
  return 72;
};

const getReadinessModifiers = (workout) => {
  const soreness = workout?.soreness ?? 5;
  const sleepQuality = workout?.sleepQuality ?? 7;
  const energyLevel = workout?.energyLevel ?? 7;
  const sessionRPE = workout?.sessionRPE ?? workout?.averageRPE ?? 7;
  let modifier = 0;
  const reasons = [];

  if (soreness >= 8) {
    modifier -= 15;
    reasons.push("Soreness was high.");
  } else if (soreness >= 5) {
    modifier -= 8;
    reasons.push("Soreness was moderate.");
  }

  if (sleepQuality <= 4) {
    modifier -= 12;
    reasons.push("Sleep quality was low.");
  } else if (sleepQuality <= 6) {
    modifier -= 6;
    reasons.push("Sleep quality was moderate.");
  }

  if (energyLevel <= 4) {
    modifier -= 12;
    reasons.push("Energy level was low.");
  } else if (energyLevel <= 6) {
    modifier -= 6;
    reasons.push("Energy level was moderate.");
  }

  if (sessionRPE >= 9) {
    modifier -= 10;
    reasons.push("Average session RPE was high.");
  } else if (sessionRPE >= 8) {
    modifier -= 5;
    reasons.push("Average session RPE was challenging.");
  }

  if ((workout?.failedSetCount || 0) > 0) {
    modifier -= 8;
    reasons.push("Failed sets indicate extra fatigue.");
  }

  return { modifier, reasons };
};

const getGoalModifier = ({ user, muscleGroup, directLevel, indirectLevel, totalLoad, mediumHighMuscleCount }) => {
  const goalPath = user?.goalPath;
  const reasons = [];
  let modifier = 0;
  const isHighDirect = directLevel === "High" || directLevel === "Very High";

  if (goalPath === "Strength Warrior" && isHighDirect) {
    modifier -= 8;
    reasons.push("Strength Warrior scoring is stricter after heavy direct loading.");
  }

  if (goalPath === "Muscle Builder" && totalLoad >= 1500) {
    modifier -= 8;
    reasons.push("Muscle Builder recovery is stricter after very high volume.");
  }

  if (goalPath === "Fat Loss Fighter" && totalLoad < 300) {
    modifier += 5;
    reasons.push("Low-load work is treated slightly more tolerantly for Fat Loss Fighter.");
  }

  if (goalPath === "Beginner Foundation") {
    modifier -= 8;
    reasons.push("Beginner Foundation uses a more conservative recovery estimate.");
  }

  if (
    goalPath === "Glute Growth" &&
    ["Glutes", "Hamstrings", "Legs", "Lower Back"].includes(muscleGroup) &&
    (isHighDirect || indirectLevel === "High" || indirectLevel === "Very High")
  ) {
    modifier -= 8;
    reasons.push("Glute Growth is stricter with lower-body recovery.");
  }

  if (goalPath === "Athletic Performance" && mediumHighMuscleCount >= 4) {
    modifier -= 6;
    reasons.push("Multiple muscles were loaded, so athletic recovery is more conservative.");
  }

  return { modifier, reasons };
};

export const calculateRecoveryScore = ({ user, muscleGroup, loadData, latestWorkout, mediumHighMuscleCount = 0, now = new Date() }) => {
  const directLoad = Number(loadData?.lastDirectLoad) || 0;
  const indirectLoad = Number(loadData?.lastIndirectLoad) || 0;
  const stabiliserLoad = Number(loadData?.lastStabiliserLoad) || 0;
  const totalLoad = directLoad + indirectLoad + stabiliserLoad;
  const directLevel = getLoadLevel(directLoad);
  const indirectLevel = getLoadLevel(indirectLoad);
  const stabiliserLevel = getLoadLevel(stabiliserLoad);
  const reasons = [];
  let score = 100;

  if (totalLoad <= 0) {
    return {
      muscleGroup,
      score: null,
      status: "No Data",
      restRecommendationHours: null,
      nextRecommendedTrainingTime: null,
      confidence: "none",
      dataAvailable: false,
      reasons: [
        `No ${muscleGroup.toLowerCase()} training data yet.`,
        `Log a ${muscleGroup.toLowerCase()} workout before ForgeLift can estimate recovery.`
      ]
    };
  }

  if (directLoad > 0) {
    score -= fatigueByLoadLevel.directLoad[directLevel];
    score += Math.min(60, hoursBetween(loadData.lastDirectLoadAt, now) * 2);
    reasons.push(`${muscleGroup} received a ${directLevel} direct load.`);
  }

  if (indirectLoad > 0) {
    score -= fatigueByLoadLevel.indirectLoad[indirectLevel];
    score += Math.min(50, hoursBetween(loadData.lastIndirectLoadAt, now) * 3);
    reasons.push(`${muscleGroup} was indirectly loaded during related movements.`);
  }

  if (stabiliserLoad > 0) {
    score -= fatigueByLoadLevel.stabiliserLoad[stabiliserLevel];
    score += Math.min(40, hoursBetween(loadData.lastStabiliserLoadAt, now) * 4);
    reasons.push(`${muscleGroup} contributed as a stabiliser.`);
  }

  const readiness = getReadinessModifiers(latestWorkout);
  score += readiness.modifier;
  reasons.push(...readiness.reasons);

  if (user?.trainingExperience === "Beginner" && (directLevel === "High" || directLevel === "Very High")) {
    score -= 5;
    reasons.push("Beginner recovery is slightly more conservative after hard training.");
  }

  if (user?.trainingExperience === "Advanced" && totalLoad > 0 && (getLoadLevel(totalLoad) === "Low" || getLoadLevel(totalLoad) === "Medium")) {
    score += 5;
    reasons.push("Advanced training experience improves recovery estimate for lower loads.");
  }

  const goalModifier = getGoalModifier({ user, muscleGroup, directLevel, indirectLevel, totalLoad, mediumHighMuscleCount });
  score += goalModifier.modifier;
  reasons.push(...goalModifier.reasons);

  const finalScore = clamp(score);
  const status = getStatus(finalScore);
  const restRecommendationHours = getRestRecommendationHours(finalScore);
  const nextRecommendedTrainingTime = new Date(now.getTime() + restRecommendationHours * 60 * 60 * 1000);

  if (restRecommendationHours > 0) {
    reasons.push(`Recommended rest before heavy ${muscleGroup} training: ${restRecommendationHours} hours.`);
  } else {
    reasons.push(`${muscleGroup} is ready for hard training.`);
  }

  return {
    muscleGroup,
    score: finalScore,
    status,
    restRecommendationHours,
    nextRecommendedTrainingTime,
    confidence: totalLoad > 0 ? "medium" : "none",
    dataAvailable: totalLoad > 0,
    reasons
  };
};
