import { RANKS } from "./rankConfig.js";
import { MUSCLE_GROUPS, MUSCLE_GROUP_EXERCISES } from "./muscleGroupMappings.js";

const severityOrder = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const rankLevel = (rankName) => RANKS.find((rank) => rank.name === rankName)?.level || 1;

const createWeakPoint = ({
  type,
  muscleGroup = "",
  relatedMuscles = [],
  severity = "Low",
  scoreImpact = 0,
  title,
  message,
  recommendation,
  evidence = {}
}) => ({
  type,
  muscleGroup,
  relatedMuscles,
  severity,
  scoreImpact,
  title,
  message,
  recommendation,
  evidence,
  active: true,
  detectedAt: new Date()
});

const getMuscleTotals = (trainingBalance) => trainingBalance?.volumeBreakdown?.muscleTotals || {};

const getExerciseSessions = (workouts, exerciseName) => {
  return workouts
    .filter((workout) => workout.exercises?.some((exercise) => exercise.exerciseName === exerciseName))
    .map((workout) => {
      const exercise = workout.exercises.find((item) => item.exerciseName === exerciseName);
      return {
        date: workout.date,
        estimated1RM: exercise.exerciseBestEstimated1RM || 0,
        volume: exercise.exerciseTotalVolume || 0
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const hasStalled = (sessions) => {
  if (sessions.length < 3) return false;
  const [latest, previous, oldest] = sessions.slice(0, 3);
  return latest.estimated1RM <= previous.estimated1RM && previous.estimated1RM <= oldest.estimated1RM && latest.volume <= previous.volume;
};

export const detectWeakPoints = ({ user, workouts = [], muscleRanks = [], trainingBalance, personalRecords = [] }) => {
  const weakPoints = [];
  const muscleTotals = getMuscleTotals(trainingBalance);

  if (!workouts.length) {
    return [
      createWeakPoint({
        type: "insufficient_data",
        severity: "Low",
        title: "Not enough training data yet",
        message: "ForgeLift cannot detect weak points until you log real workouts.",
        recommendation: "Log at least 2 to 3 workouts across different muscle groups.",
        evidence: { workoutCount: 0 }
      })
    ];
  }

  if (workouts.length < 3 || trainingBalance?.minimumDataMet === false) {
    return [
      createWeakPoint({
        type: "insufficient_data",
        severity: "Low",
        title: "Weak point detection is still learning",
        message: "ForgeLift needs more comparable training data before naming real weak points.",
        recommendation: "Log at least 3 workouts including push, pull, and lower-body training.",
        evidence: { workoutCount: workouts.length }
      })
    ];
  }
  const strongestRank = muscleRanks.reduce((best, rank) => (rankLevel(rank.rank) > rankLevel(best.rank) ? rank : best), {
    rank: "Copper"
  });

  muscleRanks.forEach((rank) => {
    const gap = rankLevel(strongestRank.rank) - rankLevel(rank.rank);

    if (gap >= 2 && rank.workoutCount > 0) {
      weakPoints.push(
        createWeakPoint({
          type: "muscle_rank_gap",
          muscleGroup: rank.muscleGroup,
          severity: gap >= 4 ? "Critical" : gap >= 3 ? "High" : "Medium",
          scoreImpact: gap * 8,
          title: `${rank.muscleGroup} rank gap`,
          message: `${rank.muscleGroup} is ${gap} ranks behind ${strongestRank.muscleGroup}.`,
          recommendation: `Add focused ${rank.muscleGroup.toLowerCase()} work over the next training block.`,
          evidence: { currentRank: rank.rank, strongestRank: strongestRank.rank, gap }
        })
      );
    }
  });

  Object.entries(muscleTotals).forEach(([muscle, load]) => {
    if (load.indirectLoad > 500 && load.directLoad < load.indirectLoad * 0.25) {
      weakPoints.push(
        createWeakPoint({
          type: "indirect_only_training",
          muscleGroup: muscle,
          severity: load.indirectLoad > 1500 ? "High" : "Medium",
          scoreImpact: 12,
          title: `${muscle} lacks direct work`,
          message: `${muscle} receives a lot of indirect load, but direct training is low.`,
          recommendation: `Add direct ${muscle.toLowerCase()} work instead of relying only on carryover from compound lifts.`,
          evidence: { directLoad: load.directLoad, indirectLoad: load.indirectLoad }
        })
      );
    }

    if (load.weightedLoad > 0 && load.directLoad < 150) {
      weakPoints.push(
        createWeakPoint({
          type: "low_direct_volume",
          muscleGroup: muscle,
          severity: "Low",
          scoreImpact: 5,
          title: `${muscle} direct volume is low`,
          message: `${muscle} has very little direct loading in the last 28 days.`,
          recommendation: `Add direct sets for ${muscle.toLowerCase()} if it supports your goal path.`,
          evidence: { directLoad: load.directLoad, weightedLoad: load.weightedLoad }
        })
      );
    }
  });

  if (trainingBalance.pushPullRatio > 1.6 || trainingBalance.pushPullRatio < 0.6) {
    weakPoints.push(
      createWeakPoint({
        type: "push_pull_imbalance",
        muscleGroup: trainingBalance.pushPullRatio > 1.6 ? "Back" : "Chest",
        relatedMuscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
        severity: trainingBalance.pushPullRatio > 2.2 || trainingBalance.pushPullRatio < 0.4 ? "Critical" : "High",
        scoreImpact: 20,
        title: "Push/Pull imbalance",
        message:
          trainingBalance.pushPullRatio > 1.6
            ? `Push volume is ${trainingBalance.pushPullRatio}x higher than pull volume.`
            : `Pull volume is much higher than push volume at a ${trainingBalance.pushPullRatio}x ratio.`,
        recommendation:
          trainingBalance.pushPullRatio > 1.6
            ? "Add rows, pulldowns, and rear delt work this week."
            : "Add pressing work if it fits your recovery and goals.",
        evidence: { pushPullRatio: trainingBalance.pushPullRatio }
      })
    );
  }

  if (trainingBalance.upperLowerRatio > 2 || trainingBalance.upperLowerRatio < 0.5) {
    weakPoints.push(
      createWeakPoint({
        type: "upper_lower_imbalance",
        muscleGroup: trainingBalance.upperLowerRatio > 2 ? "Legs" : "Upper Body",
        severity: "High",
        scoreImpact: 18,
        title: "Upper/Lower imbalance",
        message:
          trainingBalance.upperLowerRatio > 2
            ? "Upper body volume is much higher than lower body."
            : "Lower body volume is much higher than upper body.",
        recommendation: "Add the undertrained half of the body to restore balance.",
        evidence: { upperLowerRatio: trainingBalance.upperLowerRatio }
      })
    );
  }

  if (trainingBalance.frontRearRatio > 1.8 || trainingBalance.frontRearRatio < 0.6) {
    weakPoints.push(
      createWeakPoint({
        type: "front_rear_imbalance",
        muscleGroup: trainingBalance.frontRearRatio > 1.8 ? "Rear Chain" : "Front Chain",
        severity: "High",
        scoreImpact: 15,
        title: "Front/Rear chain imbalance",
        message:
          trainingBalance.frontRearRatio > 1.8
            ? "Front-chain training is dominating rear-chain work."
            : "Rear-chain work is dominating front-chain work.",
        recommendation: "Balance front-chain work with back, glutes, hamstrings, and rear delts.",
        evidence: { frontRearRatio: trainingBalance.frontRearRatio }
      })
    );
  }

  MUSCLE_GROUPS.forEach((muscleGroup) => {
    const directDates = workouts
      .filter((workout) => {
        const directLoad = workout.muscleLoadSummary?.[muscleGroup]?.directLoad || 0;
        return directLoad > 0;
      })
      .map((workout) => new Date(workout.date));
    const lastDirectDate = directDates.sort((a, b) => b - a)[0];
    const daysSince = lastDirectDate ? (Date.now() - lastDirectDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

    if (daysSince > 14) {
      weakPoints.push(
        createWeakPoint({
          type: "low_frequency",
          muscleGroup,
          severity: daysSince > 28 ? "Medium" : "Low",
          scoreImpact: 8,
          title: `${muscleGroup} frequency is low`,
          message: `${muscleGroup} has not been trained directly for over 14 days.`,
          recommendation: `Add direct ${muscleGroup.toLowerCase()} work soon.`,
          evidence: { daysSinceDirectTraining: Math.round(daysSince) }
        })
      );
    }
  });

  Object.values(MUSCLE_GROUP_EXERCISES)
    .flat()
    .filter((exerciseName, index, list) => list.indexOf(exerciseName) === index)
    .forEach((exerciseName) => {
      const sessions = getExerciseSessions(workouts, exerciseName);

      if (hasStalled(sessions)) {
        weakPoints.push(
          createWeakPoint({
            type: "stalled_progress",
            muscleGroup: exerciseName,
            severity: "Medium",
            scoreImpact: 10,
            title: `${exerciseName} may be stalling`,
            message: `${exerciseName} has not improved across the last 3 logged sessions.`,
            recommendation: "Review load, reps, fatigue, and exercise placement before adding more intensity.",
            evidence: { sessions: sessions.slice(0, 3) }
          })
        );
      }
    });

  if (user.goalPath === "Glute Growth" && (muscleTotals.Glutes?.directLoad || 0) < 500) {
    weakPoints.push(
      createWeakPoint({
        type: "goal_path_mismatch",
        muscleGroup: "Glutes",
        severity: "High",
        scoreImpact: 18,
        title: "Glute Growth mismatch",
        message: "Glute Growth is selected, but direct glute load is low.",
        recommendation: "Prioritize hip thrusts, squats, and Romanian deadlifts.",
        evidence: { directGluteLoad: muscleTotals.Glutes?.directLoad || 0 }
      })
    );
  }

  if (user.goalPath === "Fat Loss Fighter") {
    const last7 = workouts.filter((workout) => new Date(workout.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    if (last7.length < 3) {
      weakPoints.push(
        createWeakPoint({
          type: "goal_path_mismatch",
          muscleGroup: "Consistency",
          severity: "Medium",
          scoreImpact: 12,
          title: "Fat Loss Fighter consistency gap",
          message: "Fat Loss Fighter benefits from at least 3 workouts per week.",
          recommendation: "Add another manageable session or conditioning day.",
          evidence: { workoutsLast7Days: last7.length }
        })
      );
    }
  }

  if (user.goalPath === "Beginner Foundation") {
    const highRpeCount = workouts.filter((workout) => (workout.averageRPE || workout.sessionRPE || 0) >= 9).length;
    if (highRpeCount >= 2) {
      weakPoints.push(
        createWeakPoint({
          type: "goal_path_mismatch",
          muscleGroup: "Intensity",
          severity: "Medium",
          scoreImpact: 10,
          title: "Intensity is high for Beginner Foundation",
          message: "Several recent sessions are very high RPE.",
          recommendation: "Use more moderate efforts while building consistency and technique.",
          evidence: { highRpeSessions: highRpeCount }
        })
      );
    }
  }

  if (user.goalPath === "Strength Warrior") {
    const compoundNames = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row"];
    const neglected = compoundNames.filter((name) => !workouts.some((workout) => workout.exercises?.some((exercise) => exercise.exerciseName === name)));
    if (neglected.length >= 3) {
      weakPoints.push(
        createWeakPoint({
          type: "goal_path_mismatch",
          muscleGroup: "Compound Lifts",
          severity: "Medium",
          scoreImpact: 12,
          title: "Compound lift frequency is low",
          message: "Strength Warrior needs regular compound lift exposure.",
          recommendation: `Add ${neglected.slice(0, 2).join(" or ")} soon.`,
          evidence: { neglectedCompounds: neglected }
        })
      );
    }
  }

  return weakPoints.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
};
