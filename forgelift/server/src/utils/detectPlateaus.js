const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const getWorkingSets = (sets = []) => {
  const completedSets = sets.filter((set) => set.completed !== false);
  const heaviest = Math.max(...completedSets.map((set) => Number(set.weight) || 0), 0);
  const threshold = heaviest * 0.6;
  return completedSets.filter((set) => (Number(set.weight) || 0) >= threshold);
};

const average = (values = []) => {
  const realValues = values.filter((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)));
  if (!realValues.length) return 0;
  return realValues.reduce((total, value) => total + Number(value), 0) / realValues.length;
};

const getExerciseSession = (workout, exercise) => {
  const workingSets = getWorkingSets(exercise.sets || []);
  const topWorkingWeight = Math.max(...workingSets.map((set) => Number(set.weight) || 0), 0);
  const failedSetCount = (exercise.sets || []).filter((set) => set.completed === false).length;

  return {
    workoutId: workout._id,
    date: workout.date,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    bestEstimated1RM: roundOne(Math.max(...workingSets.map((set) => Number(set.estimated1RM) || 0), 0)),
    exerciseTotalVolume: roundOne(workingSets.reduce((total, set) => total + (Number(set.setVolume) || 0), 0)),
    topWorkingWeight,
    averageWorkingRPE: roundOne(average(workingSets.map((set) => set.rpe))),
    failedSetCount,
    workingSetCount: workingSets.length
  };
};

const hasMeaningfulImprovement = (latestValue, previousValues = [], threshold = 0.01) => {
  const previousBest = Math.max(...previousValues, 0);
  if (previousBest <= 0) return latestValue > 0;
  return latestValue > previousBest * (1 + threshold);
};

const isDecreasing = (values = []) => values.length >= 3 && values[0] < values[1] && values[1] <= values[2];

export const detectPlateaus = ({ workouts = [] }) => {
  const exerciseSessions = new Map();

  workouts.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      if (!exercise.exerciseName) return;
      const current = exerciseSessions.get(exercise.exerciseName) || [];
      current.push(getExerciseSession(workout, exercise));
      exerciseSessions.set(exercise.exerciseName, current);
    });
  });

  const plateaus = [];

  exerciseSessions.forEach((sessions, exerciseName) => {
    const sortedSessions = sessions
      .filter((session) => session.workingSetCount > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (sortedSessions.length < 3) return;

    const latest = sortedSessions[0];
    const previousSessions = sortedSessions.slice(1);
    const estimated1RMTrend = sortedSessions.map((session) => session.bestEstimated1RM);
    const volumeTrend = sortedSessions.map((session) => session.exerciseTotalVolume);
    const averageRPETrend = sortedSessions.map((session) => session.averageWorkingRPE);
    const failedSetCount = sortedSessions.reduce((total, session) => total + session.failedSetCount, 0);
    const noEstimated1RMImprovement = !hasMeaningfulImprovement(
      latest.bestEstimated1RM,
      previousSessions.map((session) => session.bestEstimated1RM)
    );
    const noVolumeImprovement = !hasMeaningfulImprovement(
      latest.exerciseTotalVolume,
      previousSessions.map((session) => session.exerciseTotalVolume),
      0.03
    );
    const averageRecentRPE = roundOne(average(averageRPETrend.filter(Boolean)));
    const performanceDecreasing = isDecreasing(estimated1RMTrend) || isDecreasing(volumeTrend);
    const repeatedFailedSets = failedSetCount >= 2;

    let severity = "";
    let reason = "";

    if (sortedSessions.length >= 5 && noEstimated1RMImprovement && noVolumeImprovement && performanceDecreasing) {
      severity = "Critical";
      reason = `${exerciseName} has not progressed across 5 recent sessions and performance is trending down.`;
    } else if (sortedSessions.length >= 4 && noEstimated1RMImprovement && noVolumeImprovement && (averageRecentRPE >= 9 || repeatedFailedSets)) {
      severity = "High";
      reason = `${exerciseName} has not improved for 4 sessions and effort is high.`;
    } else if (noEstimated1RMImprovement && noVolumeImprovement && averageRecentRPE >= 8.5) {
      severity = "Medium";
      reason = `${exerciseName} has stalled for 3 sessions with high average RPE.`;
    } else if (noEstimated1RMImprovement && averageRecentRPE < 8.5) {
      severity = "Low";
      reason = `${exerciseName} has not improved in estimated 1RM yet, but fatigue signals are not severe.`;
    }

    if (!severity) return;

    plateaus.push({
      exerciseId: latest.exerciseId,
      exerciseName,
      severity,
      sessionsAnalysed: sortedSessions.length,
      estimated1RMTrend,
      volumeTrend,
      averageRPETrend,
      failedSetCount,
      topWorkingWeight: latest.topWorkingWeight,
      currentVolume: latest.exerciseTotalVolume,
      reason,
      evidence: {
        dates: sortedSessions.map((session) => session.date),
        noEstimated1RMImprovement,
        noVolumeImprovement,
        averageRecentRPE,
        performanceDecreasing,
        repeatedFailedSets
      }
    });
  });

  return plateaus;
};
