import PersonalRecord from "../models/PersonalRecord.js";

const buildExerciseQuery = (userId, exercise, recordType, extra = {}) => {
  const query = {
    userId,
    recordType,
    ...extra
  };

  if (exercise.exerciseId) {
    query.exerciseId = exercise.exerciseId;
  } else {
    query.exerciseName = exercise.exerciseName;
  }

  return query;
};

const findPreviousBest = async (userId, exercise, recordType, extra = {}) => {
  return PersonalRecord.findOne(buildExerciseQuery(userId, exercise, recordType, extra)).sort({ value: -1 });
};

const createRecord = async ({ userId, workout, exercise, recordType, value, set, volume }) => {
  return PersonalRecord.create({
    userId,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    recordType,
    value,
    weight: set?.weight,
    reps: set?.reps,
    volume,
    estimated1RM: set?.estimated1RM,
    workoutId: workout._id,
    achievedAt: workout.date
  });
};

export const detectPersonalRecords = async ({ userId, workout }) => {
  const newRecords = [];

  for (const exercise of workout.exercises || []) {
    const completedSets = (exercise.sets || []).filter((set) => set.completed !== false);

    if (!completedSets.length) continue;

    const heaviestSet = completedSets.reduce((best, set) => ((set.weight || 0) > (best.weight || 0) ? set : best), completedSets[0]);
    const bestEstimatedSet = completedSets.reduce(
      (best, set) => ((set.estimated1RM || 0) > (best.estimated1RM || 0) ? set : best),
      completedSets[0]
    );

    const previousHeaviest = await findPreviousBest(userId, exercise, "heaviest_weight");
    if (!previousHeaviest || (heaviestSet.weight || 0) > previousHeaviest.value) {
      newRecords.push(
        await createRecord({
          userId,
          workout,
          exercise,
          recordType: "heaviest_weight",
          value: heaviestSet.weight || 0,
          set: heaviestSet
        })
      );
    }

    const previousEstimated = await findPreviousBest(userId, exercise, "best_estimated_1rm");
    if (!previousEstimated || (bestEstimatedSet.estimated1RM || 0) > previousEstimated.value) {
      newRecords.push(
        await createRecord({
          userId,
          workout,
          exercise,
          recordType: "best_estimated_1rm",
          value: bestEstimatedSet.estimated1RM || 0,
          set: bestEstimatedSet
        })
      );
    }

    const bestRepsByWeight = new Map();
    completedSets.forEach((set) => {
      const weightKey = String(set.weight || 0);
      const currentBest = bestRepsByWeight.get(weightKey);

      if (!currentBest || (set.reps || 0) > (currentBest.reps || 0)) {
        bestRepsByWeight.set(weightKey, set);
      }
    });

    for (const set of bestRepsByWeight.values()) {
      const previousReps = await findPreviousBest(userId, exercise, "best_reps_at_weight", {
        weight: set.weight || 0
      });

      if (!previousReps || (set.reps || 0) > previousReps.value) {
        newRecords.push(
          await createRecord({
            userId,
            workout,
            exercise,
            recordType: "best_reps_at_weight",
            value: set.reps || 0,
            set
          })
        );
      }
    }

    const previousVolume = await findPreviousBest(userId, exercise, "best_volume");
    if (!previousVolume || (exercise.exerciseTotalVolume || 0) > previousVolume.value) {
      newRecords.push(
        await createRecord({
          userId,
          workout,
          exercise,
          recordType: "best_volume",
          value: exercise.exerciseTotalVolume || 0,
          volume: exercise.exerciseTotalVolume || 0
        })
      );
    }
  }

  return newRecords;
};
