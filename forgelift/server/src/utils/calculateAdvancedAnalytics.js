const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const isInPeriod = (date, start, end) => {
  const value = new Date(date).getTime();
  return value >= new Date(start).getTime() && value <= new Date(end).getTime();
};

const getWeekKey = (date) => {
  const value = new Date(date);
  const first = new Date(value.getFullYear(), 0, 1);
  const week = Math.ceil(((value - first) / 86400000 + first.getDay() + 1) / 7);
  return `${value.getFullYear()} W${week}`;
};

const getMonthKey = (date) =>
  new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date));

const addToMap = (map, key, value) => {
  map[key] = roundOne((map[key] || 0) + (Number(value) || 0));
};

const getAverage = (values = []) => {
  const realValues = values.filter((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)));
  if (!realValues.length) return 0;
  return roundOne(realValues.reduce((total, value) => total + Number(value), 0) / realValues.length);
};

const getWorkoutMuscleLoads = (workout) => workout.muscleLoadSummary || workout.muscleVolumeSummary || {};

const buildStrengthTrends = (workouts) => {
  const exerciseMap = {};

  workouts.forEach((workout) => {
    workout.exercises?.forEach((exercise) => {
      if (!exercise.exerciseName) return;
      exerciseMap[exercise.exerciseName] = exerciseMap[exercise.exerciseName] || [];
      exerciseMap[exercise.exerciseName].push({
        date: workout.date,
        label: new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(workout.date)),
        estimated1RM: roundOne(exercise.exerciseBestEstimated1RM || 0),
        heaviestWeight: roundOne(Math.max(...(exercise.sets || []).map((set) => Number(set.weight) || 0), 0)),
        volume: roundOne(exercise.exerciseTotalVolume || 0)
      });
    });
  });

  return Object.entries(exerciseMap)
    .map(([exerciseName, points]) => ({
      exerciseName,
      data: points.sort((a, b) => new Date(a.date) - new Date(b.date)),
      bestEstimated1RM: roundOne(Math.max(...points.map((point) => point.estimated1RM), 0))
    }))
    .sort((a, b) => b.bestEstimated1RM - a.bestEstimated1RM)
    .slice(0, 8);
};

const buildMuscleDistribution = (workouts) => {
  const muscles = {};

  workouts.forEach((workout) => {
    Object.entries(getWorkoutMuscleLoads(workout)).forEach(([muscle, load]) => {
      muscles[muscle] = muscles[muscle] || {
        muscle,
        directLoad: 0,
        indirectLoad: 0,
        stabiliserLoad: 0,
        totalLoad: 0
      };

      muscles[muscle].directLoad += Number(load.directLoad ?? load) || 0;
      muscles[muscle].indirectLoad += Number(load.indirectLoad) || 0;
      muscles[muscle].stabiliserLoad += Number(load.stabiliserLoad) || 0;
      muscles[muscle].totalLoad += Number(load.totalLoad ?? load) || 0;
    });
  });

  return Object.values(muscles)
    .map((item) => ({
      muscle: item.muscle,
      directLoad: roundOne(item.directLoad),
      indirectLoad: roundOne(item.indirectLoad),
      stabiliserLoad: roundOne(item.stabiliserLoad),
      totalLoad: roundOne(item.totalLoad)
    }))
    .sort((a, b) => b.totalLoad - a.totalLoad);
};

const buildVolumeTrends = (workouts, muscleLoadDistribution) => {
  const byWeek = {};
  const byMonth = {};
  const byExercise = {};

  workouts.forEach((workout) => {
    addToMap(byWeek, getWeekKey(workout.date), workout.totalVolume);
    addToMap(byMonth, getMonthKey(workout.date), workout.totalVolume);

    workout.exercises?.forEach((exercise) => {
      addToMap(byExercise, exercise.exerciseName, exercise.exerciseTotalVolume);
    });
  });

  return {
    byWeek: Object.entries(byWeek).map(([period, totalVolume]) => ({ period, totalVolume })),
    byMonth: Object.entries(byMonth).map(([period, totalVolume]) => ({ period, totalVolume })),
    byMuscleGroup: muscleLoadDistribution.map((item) => ({ muscle: item.muscle, totalLoad: item.totalLoad })),
    byExercise: Object.entries(byExercise)
      .map(([exerciseName, totalVolume]) => ({ exerciseName, totalVolume }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10)
  };
};

const buildPrInsights = (personalRecords) => {
  const byExercise = {};
  const byType = {};

  personalRecords.forEach((record) => {
    byExercise[record.exerciseName] = (byExercise[record.exerciseName] || 0) + 1;
    byType[record.recordType] = (byType[record.recordType] || 0) + 1;
  });

  const bestPR = [...personalRecords].sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null;
  const latestPR = [...personalRecords].sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt))[0] || null;

  return {
    latestPR,
    bestPR,
    countByExercise: Object.entries(byExercise).map(([exerciseName, count]) => ({ exerciseName, count })),
    countByType: Object.entries(byType).map(([recordType, count]) => ({ recordType, count }))
  };
};

const buildRecommendations = ({ overview, muscleLoadDistribution, weakPoints, trainingBalance, recoveryScores, missionInsights }) => {
  const recommendations = [];
  const topWeakPoint = weakPoints[0];
  const lowestRecovery = [...recoveryScores].sort((a, b) => a.score - b.score)[0];
  const leastLoadedMuscle = [...muscleLoadDistribution].reverse()[0];

  if (topWeakPoint) {
    recommendations.push(`${topWeakPoint.muscleGroup || "A weak area"} remains a priority. ${topWeakPoint.recommendation || "Add focused work next week."}`);
  }

  if (trainingBalance?.warnings?.[0]) {
    recommendations.push(trainingBalance.warnings[0]);
  }

  if (lowestRecovery && lowestRecovery.score < 60) {
    recommendations.push(`${lowestRecovery.muscleGroup} recovery is trending low. Avoid heavy direct work until readiness improves.`);
  }

  if (missionInsights.completionPercentage >= 75) {
    recommendations.push("Mission completion is strong. Keep the weekly target steady before adding more work.");
  } else if (missionInsights.activeMissions > 0) {
    recommendations.push("Mission completion needs attention. Focus on the highest-priority active mission first.");
  }

  if (leastLoadedMuscle && overview.totalWorkouts >= 3) {
    recommendations.push(`${leastLoadedMuscle.muscle} received relatively little load. Consider adding direct work if it fits your goal path.`);
  }

  if (!recommendations.length) {
    recommendations.push("Log at least 3 workouts to unlock stronger progress insights.");
  }

  return recommendations.slice(0, 6);
};

export const calculateAdvancedAnalytics = ({
  user,
  workouts = [],
  personalRecords = [],
  muscleRanks = [],
  recoveryScores = [],
  trainingBalance,
  weakPoints = [],
  missions = [],
  overloadRecommendations = [],
  deloadRecommendations = [],
  periodStart,
  periodEnd
}) => {
  const periodWorkouts = workouts.filter((workout) => isInPeriod(workout.date, periodStart, periodEnd));
  const periodPRs = personalRecords.filter((record) => isInPeriod(record.achievedAt || record.createdAt, periodStart, periodEnd));
  const periodMissions = missions.filter((mission) => isInPeriod(mission.completedAt || mission.updatedAt || mission.createdAt, periodStart, periodEnd));
  const completedMissions = periodMissions.filter((mission) => mission.status === "completed");
  const muscleLoadDistribution = buildMuscleDistribution(periodWorkouts);
  const volumeTrends = buildVolumeTrends(periodWorkouts, muscleLoadDistribution);
  const strengthTrends = buildStrengthTrends(periodWorkouts);
  const prInsights = buildPrInsights(periodPRs);
  const averageRecoveryScore = getAverage(recoveryScores.map((score) => score.score));
  const lowestRecovery = [...recoveryScores].sort((a, b) => a.score - b.score).slice(0, 5);
  const bestMuscleRank = [...muscleRanks].sort((a, b) => b.score - a.score)[0] || null;
  const lowestMuscleRank = [...muscleRanks].filter((rank) => rank.workoutCount > 0).sort((a, b) => a.score - b.score)[0] || null;
  const closestToNextRank = [...muscleRanks]
    .filter((rank) => rank.nextRank)
    .sort((a, b) => a.pointsToNextRank - b.pointsToNextRank)
    .slice(0, 5);
  const missionInsights = {
    activeMissions: missions.filter((mission) => mission.status === "active").length,
    completedMissions: completedMissions.length,
    completionPercentage: missions.length ? Math.round((missions.filter((mission) => mission.status === "completed").length / missions.length) * 100) : 0,
    xpEarnedFromMissions: completedMissions.reduce((total, mission) => total + (mission.xpReward || 0), 0)
  };
  const overview = {
    totalWorkouts: periodWorkouts.length,
    totalVolume: roundOne(periodWorkouts.reduce((total, workout) => total + (workout.totalVolume || 0), 0)),
    totalSets: periodWorkouts.reduce((total, workout) => total + (workout.totalSets || 0), 0),
    totalReps: periodWorkouts.reduce((total, workout) => total + (workout.totalReps || 0), 0),
    averageSessionRPE: getAverage(periodWorkouts.map((workout) => workout.sessionRPE)),
    totalPRs: periodPRs.length,
    missionsCompleted: completedMissions.length,
    activeWeakPoints: weakPoints.filter((weakPoint) => weakPoint.active !== false).length,
    activeDeloads: deloadRecommendations.filter((deload) => deload.status === "active").length
  };
  const recoveryTrends = {
    averageRecoveryScore,
    lowestRecovery,
    musclesBelow60: recoveryScores.filter((score) => score.score < 60).map((score) => ({
      muscleGroup: score.muscleGroup,
      score: score.score
    }))
  };
  const rankInsights = {
    currentOverallRank: user.currentOverallRank || "Copper",
    overallRankScore: user.overallRankScore || 0,
    bestMuscleRank,
    lowestMuscleRank,
    closestToNextRank
  };
  const balanceInsights = {
    score: trainingBalance?.score || 0,
    status: trainingBalance?.status || "No data",
    mainWarning: trainingBalance?.warnings?.[0] || "",
    strongestAreas: trainingBalance?.strongestAreas || [],
    weakestAreas: trainingBalance?.weakestAreas || []
  };
  const recommendations = buildRecommendations({
    overview,
    muscleLoadDistribution,
    weakPoints,
    trainingBalance,
    recoveryScores,
    missionInsights
  });

  return {
    overview,
    volumeTrends,
    strengthTrends,
    muscleLoadDistribution,
    prInsights,
    recoveryTrends,
    missionInsights,
    rankInsights,
    balanceInsights,
    overloadInsights: {
      activeCount: overloadRecommendations.filter((recommendation) => recommendation.status === "active").length,
      warnings: overloadRecommendations.flatMap((recommendation) => recommendation.warnings || []).slice(0, 5)
    },
    deloadInsights: {
      activeCount: deloadRecommendations.filter((recommendation) => recommendation.status === "active").length,
      highestSeverity: [...deloadRecommendations].sort(
        (a, b) => ({ Critical: 4, High: 3, Medium: 2, Low: 1 }[b.severity] || 0) - ({ Critical: 4, High: 3, Medium: 2, Low: 1 }[a.severity] || 0)
      )[0] || null
    },
    recommendations
  };
};
