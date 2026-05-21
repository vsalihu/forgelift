const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const severityRank = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4
};

const getReduction = (severity) => {
  if (severity === "Critical") return 15;
  if (severity === "High") return 10;
  if (severity === "Medium") return 7.5;
  return 5;
};

const getRestDays = (severity) => {
  if (severity === "Critical") return 5;
  if (severity === "High") return 4;
  if (severity === "Medium") return 3;
  return 2;
};

export const generateExerciseDeloadRecommendation = ({ plateau, exercise }) => {
  const reductionPercentage = getReduction(plateau.severity);
  const currentWeight = Number(plateau.topWorkingWeight) || 0;
  const recommendedWeight = currentWeight > 0 ? roundOne(currentWeight * (1 - reductionPercentage / 100)) : 0;
  const repeatedFailures = plateau.failedSetCount >= 2;
  const recommendationType = repeatedFailures ? "technique_reset" : "weight_deload";

  return {
    scope: "exercise",
    exerciseId: plateau.exerciseId || exercise?._id,
    exerciseName: plateau.exerciseName,
    recommendationType,
    severity: plateau.severity,
    currentWeight,
    recommendedWeight,
    currentVolume: plateau.currentVolume || 0,
    recommendedVolume: roundOne((plateau.currentVolume || 0) * 0.75),
    reductionPercentage,
    recommendedRestDays: getRestDays(plateau.severity),
    reason:
      recommendationType === "technique_reset"
        ? `${plateau.exerciseName} shows failed-set and plateau signals. Use a technique reset before pushing again.`
        : `${plateau.exerciseName} has plateau signals that justify a short weight deload.`,
    detailedReasons: [
      plateau.reason,
      `${plateau.sessionsAnalysed} sessions analysed.`,
      `Estimated 1RM trend: ${plateau.estimated1RMTrend.join(", ")}.`,
      `Volume trend: ${plateau.volumeTrend.join(", ")}.`
    ],
    warnings: plateau.severity === "Critical" ? ["Performance is decreasing. Avoid testing maxes until rebuilt."] : [],
    plan: {
      durationDays: 7,
      reductionPercentage,
      instructions: [
        `Reduce ${plateau.exerciseName} working weight by ${reductionPercentage}%.`,
        "Keep reps controlled and avoid failure.",
        "Stop each working set with 2 to 3 reps in reserve.",
        "Return to normal progression only after recovery and set quality improve."
      ],
      nextSessionTarget:
        currentWeight > 0
          ? `${recommendedWeight}kg for controlled working sets`
          : "Use easier reps and reduce total work for one session",
      rebuildStrategy: `After the deload, rebuild with smaller jumps once all sets are controlled at RPE 8 or below.`
    },
    evidence: plateau.evidence
  };
};

export const generateMuscleDeloadRecommendation = ({ muscleGroup, fatigueData, recoveryScore }) => {
  const lowRecovery = recoveryScore && recoveryScore.score < 50;
  const severity = fatigueData.fatigueLevel === "Critical" || lowRecovery ? "High" : "Medium";
  const reductionPercentage = severity === "High" ? 35 : 25;

  return {
    scope: "muscle_group",
    muscleGroup,
    recommendationType: lowRecovery ? "rest_deload" : "volume_deload",
    severity,
    currentVolume: recoveryScore?.lastTotalLoad || 0,
    recommendedVolume: roundOne((recoveryScore?.lastTotalLoad || 0) * (1 - reductionPercentage / 100)),
    reductionPercentage,
    recommendedRestDays: lowRecovery ? 4 : 3,
    reason: `${muscleGroup} shows fatigue or low recovery signals. Reduce hard work before pushing it again.`,
    detailedReasons: [
      ...(fatigueData.reasons || []),
      recoveryScore ? `${muscleGroup} recovery is ${recoveryScore.score}%.` : `${muscleGroup} was flagged by recent training trends.`
    ],
    warnings: lowRecovery ? [`${muscleGroup} is below 50% recovery.`] : [],
    plan: {
      durationDays: 5,
      reductionPercentage,
      instructions: [
        `Reduce direct ${muscleGroup} volume by ${reductionPercentage}%.`,
        "Avoid failure and heavy top sets.",
        "Use lighter technique work or skip heavy loading until recovery improves."
      ],
      nextSessionTarget: `Keep ${muscleGroup} work easy for the next session.`,
      rebuildStrategy: "Resume normal progression when recovery is mostly ready and soreness is manageable."
    },
    evidence: fatigueData.evidence
  };
};

export const generateFullBodyDeloadRecommendation = ({ fatigueData }) => {
  const severity = fatigueData.fatigueLevel === "Critical" ? "Critical" : "High";
  const reductionPercentage = severity === "Critical" ? 50 : 35;

  return {
    scope: "full_body",
    recommendationType: "full_body_deload",
    severity,
    currentVolume: fatigueData.evidence?.last7Volume || 0,
    recommendedVolume: roundOne((fatigueData.evidence?.last7Volume || 0) * (1 - reductionPercentage / 100)),
    reductionPercentage,
    recommendedRestDays: severity === "Critical" ? 5 : 3,
    reason: "Full-body fatigue signals are high enough to justify a short deload week.",
    detailedReasons: fatigueData.reasons || [],
    warnings: ["Do not chase personal records during this deload block."],
    plan: {
      durationDays: 7,
      reductionPercentage,
      instructions: [
        `Reduce total training volume by ${reductionPercentage}% for 1 week.`,
        "Keep movement patterns but avoid grinders.",
        "Use moderate loads and stop well short of failure.",
        "Prioritise sleep, food, walking, and mobility."
      ],
      nextSessionTarget: "Run normal sessions with fewer sets and lower intensity.",
      rebuildStrategy: "Return to normal progression after the deload week if recovery scores improve."
    },
    evidence: fatigueData.evidence
  };
};

export const chooseHighestSeverity = (recommendations = []) =>
  recommendations.sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0] || null;
