import { TRAINING_CATEGORIES } from "./trainingCategories.js";
import { getMissionReward } from "./missionConfig.js";

const severityRank = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const createMission = ({
  title,
  description,
  missionType,
  goalPath,
  targetMuscleGroups = [],
  targetExerciseName = "",
  targetValue = 1,
  unit = "",
  priority = "Medium",
  startDate,
  endDate,
  evidence = {}
}) => ({
  title,
  description,
  missionType,
  goalPath,
  targetMuscleGroups,
  targetExerciseName,
  targetValue,
  currentValue: 0,
  unit,
  progressPercentage: 0,
  status: "active",
  priority,
  xpReward: getMissionReward(priority),
  rankScoreReward: 0,
  startDate,
  endDate,
  evidence
});

const addUniqueMission = (missions, mission) => {
  const key = [
    mission.missionType,
    mission.title,
    mission.targetExerciseName,
    mission.targetMuscleGroups.join(",")
  ].join(":");

  if (!missions.some((item) => [item.missionType, item.title, item.targetExerciseName, item.targetMuscleGroups.join(",")].join(":") === key)) {
    missions.push(mission);
  }
};

export const generateWeeklyMissions = ({
  user,
  currentWeekWorkouts = [],
  weeklyTarget,
  recoveryScores = [],
  weakPoints = [],
  trainingBalance,
  overloadRecommendations = [],
  deloadRecommendations = [],
  muscleRanks = [],
  weekStart,
  weekEnd
}) => {
  const goalPath = user.goalPath || "Balanced Beast";
  const missions = [];
  const activeDeloadExercises = new Set(deloadRecommendations.map((deload) => deload.exerciseName).filter(Boolean));
  const activeDeloadMuscles = new Set(deloadRecommendations.map((deload) => deload.muscleGroup).filter(Boolean));

  if (!currentWeekWorkouts.length && !weakPoints.some((weakPoint) => weakPoint.type !== "insufficient_data")) {
    if (!user.assessmentCompleted) {
      addUniqueMission(
        missions,
        createMission({
          title: "Complete your ForgeLift Assessment",
          description: "Answer a few questions so ForgeLift can estimate your starting level and baselines.",
          missionType: "consistency",
          goalPath,
          targetValue: 1,
          unit: "assessment",
          priority: "Medium",
          startDate: weekStart,
          endDate: weekEnd
        })
      );
    }

    if (!(user.strengthBaselines || []).some((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history")) {
      addUniqueMission(
        missions,
        createMission({
          title: "Add your first strength baseline",
          description: "Enter a known lift so ForgeLift can suggest conservative starting weights.",
          missionType: "consistency",
          goalPath,
          targetValue: 1,
          unit: "baseline",
          priority: "Low",
          startDate: weekStart,
          endDate: weekEnd
        })
      );
    }

    addUniqueMission(
      missions,
      createMission({
        title: "Log your first workout",
        description: "Use Gym Mode or the workout logger to unlock recovery, overload, and analytics.",
        missionType: "workout_frequency",
        goalPath,
        targetValue: 1,
        unit: "workout",
        priority: "High",
        startDate: weekStart,
        endDate: weekEnd
      })
    );

    return missions.slice(0, 6);
  }

  deloadRecommendations.slice(0, 2).forEach((deload) => {
    addUniqueMission(
      missions,
      createMission({
        title: `Complete ${deload.exerciseName || deload.muscleGroup || "full-body"} deload plan`,
        description: deload.reason || "Follow the active deload recommendation before pushing progression again.",
        missionType: "deload_compliance",
        goalPath,
        targetMuscleGroups: deload.muscleGroup ? [deload.muscleGroup] : [],
        targetExerciseName: deload.exerciseName || "",
        targetValue: 1,
        unit: "plan",
        priority: deload.severity === "Critical" ? "Critical" : "High",
        startDate: weekStart,
        endDate: weekEnd,
        evidence: { deloadRecommendationId: deload._id, recommendationType: deload.recommendationType }
      })
    );
  });

  const highWeakPoints = weakPoints
    .filter((weakPoint) => weakPoint.type !== "insufficient_data")
    .filter((weakPoint) => severityRank[weakPoint.severity] >= severityRank.Medium)
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  highWeakPoints.slice(0, 2).forEach((weakPoint) => {
    const muscles = weakPoint.relatedMuscles?.length ? weakPoint.relatedMuscles : [weakPoint.muscleGroup].filter(Boolean);
    addUniqueMission(
      missions,
      createMission({
        title: weakPoint.type === "push_pull_imbalance" ? "Complete 2 pull-focused sessions this week" : `Train ${muscles[0] || "weak area"} directly twice`,
        description: weakPoint.recommendation || weakPoint.message,
        missionType: weakPoint.type === "push_pull_imbalance" ? "training_balance" : "weak_point_fix",
        goalPath,
        targetMuscleGroups: weakPoint.type === "push_pull_imbalance" ? ["Back", "Rear Shoulders", "Biceps"] : muscles,
        targetValue: 2,
        unit: "sessions",
        priority: weakPoint.severity === "Critical" ? "Critical" : "High",
        startDate: weekStart,
        endDate: weekEnd,
        evidence: { weakPointId: weakPoint._id, weakPointType: weakPoint.type }
      })
    );
  });

  if (trainingBalance?.pushPullRatio > 1.6) {
    addUniqueMission(
      missions,
      createMission({
        title: "Bring pull volume up this week",
        description: "Your push work is ahead of pull work. Add rows, pulldowns, pull-ups, or rear delt work.",
        missionType: "training_balance",
        goalPath,
        targetMuscleGroups: ["Back", "Rear Shoulders", "Biceps"],
        targetValue: 2,
        unit: "pull sessions",
        priority: "High",
        startDate: weekStart,
        endDate: weekEnd,
        evidence: { pushPullRatio: trainingBalance.pushPullRatio }
      })
    );
  }

  const lowRecovery = recoveryScores.filter((score) => score.score < 50);
  lowRecovery.slice(0, 1).forEach((score) => {
    addUniqueMission(
      missions,
      createMission({
        title: `Protect ${score.muscleGroup} recovery`,
        description: `${score.muscleGroup} recovery is low. Avoid heavy direct work until readiness improves.`,
        missionType: "recovery_discipline",
        goalPath,
        targetMuscleGroups: [score.muscleGroup],
        targetValue: 1,
        unit: "discipline check",
        priority: "Medium",
        startDate: weekStart,
        endDate: weekEnd,
        evidence: { recoveryScore: score.score }
      })
    );
  });

  const overloadCandidate = overloadRecommendations.find((recommendation) => {
    const deloadConflict =
      activeDeloadExercises.has(recommendation.exerciseName) ||
      recommendation.muscleGroups?.some((muscle) => activeDeloadMuscles.has(muscle));
    return !deloadConflict && !["deload_flag", "recovery_warning"].includes(recommendation.recommendationType);
  });

  if (overloadCandidate) {
    addUniqueMission(
      missions,
      createMission({
        title: `Hit your next ${overloadCandidate.exerciseName} target`,
        description: overloadCandidate.reason,
        missionType: "overload_target",
        goalPath,
        targetMuscleGroups: overloadCandidate.muscleGroups || [],
        targetExerciseName: overloadCandidate.exerciseName,
        targetValue: overloadCandidate.recommendedWeight || overloadCandidate.currentWeight || 1,
        unit: "kg",
        priority: "Medium",
        startDate: weekStart,
        endDate: weekEnd,
        evidence: { overloadRecommendationId: overloadCandidate._id, recommendationType: overloadCandidate.recommendationType }
      })
    );
  }

  if (currentWeekWorkouts.length === 0) {
    addUniqueMission(
      missions,
      createMission({
        title: "Complete your first workout this week",
        description: "Start the week with one logged session so ForgeLift can update your plan.",
        missionType: "consistency",
        goalPath,
        targetValue: 1,
        unit: "workout",
        priority: "Medium",
        startDate: weekStart,
        endDate: weekEnd
      })
    );
  }

  addUniqueMission(
    missions,
    createMission({
      title: `Complete ${weeklyTarget.targetWorkouts} workouts this week`,
      description: "Stay on pace with your weekly training target.",
      missionType: "workout_frequency",
      goalPath,
      targetMuscleGroups: weeklyTarget.targetMuscleGroups || [],
      targetValue: weeklyTarget.targetWorkouts,
      unit: "workouts",
      priority: "Medium",
      startDate: weekStart,
      endDate: weekEnd
    })
  );

  if (goalPath === "Glute Growth") {
    addUniqueMission(
      missions,
      createMission({
        title: "Complete one direct glute session",
        description: "Prioritise hip thrusts, RDLs, squats, leg press, or other direct glute work.",
        missionType: "goal_path",
        goalPath,
        targetMuscleGroups: ["Glutes"],
        targetValue: 1,
        unit: "session",
        priority: "High",
        startDate: weekStart,
        endDate: weekEnd
      })
    );
  } else if (goalPath === "Athletic Performance") {
    addUniqueMission(
      missions,
      createMission({
        title: "Train core or rear chain directly",
        description: "Athletic Performance needs core, back, glute, hamstring, or lower-back support.",
        missionType: "goal_path",
        goalPath,
        targetMuscleGroups: ["Core", ...TRAINING_CATEGORIES.rear],
        targetValue: 1,
        unit: "session",
        priority: "Medium",
        startDate: weekStart,
        endDate: weekEnd
      })
    );
  } else if (goalPath === "Balanced Beast") {
    addUniqueMission(
      missions,
      createMission({
        title: "Cover a major undertrained area",
        description: "Train one of your lowest-ranked major muscle groups directly this week.",
        missionType: "goal_path",
        goalPath,
        targetMuscleGroups: muscleRanks.sort((a, b) => a.score - b.score).slice(0, 2).map((rank) => rank.muscleGroup),
        targetValue: 1,
        unit: "session",
        priority: "Medium",
        startDate: weekStart,
        endDate: weekEnd
      })
    );
  }

  return missions.slice(0, 6);
};
