const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const getMainMusclesWorked = (muscleLoadSummary = {}) => {
  return Object.entries(muscleLoadSummary)
    .sort((a, b) => (b[1].totalLoad || 0) - (a[1].totalLoad || 0))
    .slice(0, 5)
    .map(([muscle]) => muscle);
};

const recordLabels = {
  heaviest_weight: "heaviest weight",
  best_estimated_1rm: "best estimated 1RM",
  best_reps_at_weight: "best reps at weight",
  best_volume: "best exercise volume"
};

export const generateWorkoutAnalysis = ({ workout, newPersonalRecords = [] }) => {
  const muscleLoadSummary = workout.muscleLoadSummary || {};
  const mainMusclesWorked = getMainMusclesWorked(muscleLoadSummary);
  const summaryMessages = [
    `Strong session. Total volume was ${formatNumber(workout.totalVolume)}kg.`
  ];

  if (mainMusclesWorked.length) {
    summaryMessages.push(`Main muscles worked: ${mainMusclesWorked.join(", ")}.`);
  }

  Object.entries(muscleLoadSummary)
    .filter(([, load]) => load.totalLoad >= 300)
    .slice(0, 4)
    .forEach(([muscle, load]) => {
      if (load.directLoad >= load.indirectLoad && load.directLoad >= load.stabiliserLoad) {
        summaryMessages.push(`${muscle} received a ${load.loadLevel} direct load.`);
      } else if (load.indirectLoad >= load.stabiliserLoad) {
        summaryMessages.push(`${muscle} was loaded indirectly through this session.`);
      } else {
        summaryMessages.push(`${muscle} contributed as a stabiliser.`);
      }
    });

  newPersonalRecords.forEach((record) => {
    summaryMessages.push(`New PR detected: ${record.exerciseName} ${recordLabels[record.recordType]}.`);
  });

  if (workout.failedSetCount > 0) {
    summaryMessages.push(`${workout.failedSetCount} failed set${workout.failedSetCount === 1 ? "" : "s"} logged. Review load selection next time.`);
  }

  if (workout.averageRPE >= 9) {
    summaryMessages.push("High average RPE. This was a demanding session.");
  }

  return {
    totalVolume: workout.totalVolume,
    totalSets: workout.totalSets,
    totalReps: workout.totalReps,
    averageRPE: workout.averageRPE,
    heaviestWeight: workout.heaviestWeight,
    bestEstimated1RM: workout.bestEstimated1RM,
    mainMusclesWorked,
    muscleLoadSummary,
    newPersonalRecords,
    summaryMessages
  };
};
