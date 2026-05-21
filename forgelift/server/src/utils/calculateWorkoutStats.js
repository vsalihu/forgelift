import { calculateEstimated1RM } from "./calculateEstimated1RM.js";
import { calculateMuscleLoad, groupMuscleLoadSummary } from "./calculateMuscleLoad.js";
import { normalizeMuscleName } from "./muscleTaxonomy.js";

const roundOne = (value) => Math.round(value * 10) / 10;

export const calculateWorkoutStats = (exercises = []) => {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let rpeTotal = 0;
  let rpeCount = 0;
  let heaviestWeight = 0;
  let bestEstimated1RM = 0;
  let completedSetCount = 0;
  let failedSetCount = 0;
  const muscleVolumeSummary = {};

  const enrichedExercises = exercises.map((exercise) => {
    const primaryMuscles = exercise.primaryMuscles || [];
    let exerciseTotalVolume = 0;
    let exerciseTotalReps = 0;
    let exerciseTotalSets = 0;
    let exerciseRpeTotal = 0;
    let exerciseRpeCount = 0;
    let exerciseBestEstimated1RM = 0;

    const enrichedSets = (exercise.sets || []).map((set) => {
      const bodyweightOnly = Boolean(set.bodyweightOnly);
      const bodyweightUsed =
        set.bodyweightUsed === undefined || set.bodyweightUsed === null || set.bodyweightUsed === ""
          ? null
          : Number(set.bodyweightUsed) || 0;
      const addedLoad =
        set.addedLoad === undefined || set.addedLoad === null || set.addedLoad === "" ? null : Number(set.addedLoad) || 0;
      const totalLoad =
        Number(set.totalLoad) ||
        (bodyweightUsed ? bodyweightUsed + (addedLoad || 0) : Number(set.weight) || 0);
      const weight = totalLoad || Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;
      const setVolume = weight * reps;
      const estimated1RM = calculateEstimated1RM(weight, reps);
      const completed = set.completed !== false;
      const rpe = set.rpe === undefined || set.rpe === null || set.rpe === "" ? undefined : Number(set.rpe);

      if (!completed) {
        failedSetCount += 1;
        return {
          ...set,
          weight,
          reps,
          rpe,
          completed,
          setVolume: 0,
          estimated1RM: 0,
          bodyweightOnly,
          bodyweightUsed,
          addedLoad,
          totalLoad: weight
        };
      }

      totalVolume += setVolume;
      totalSets += 1;
      totalReps += reps;
      completedSetCount += 1;
      heaviestWeight = Math.max(heaviestWeight, weight);
      bestEstimated1RM = Math.max(bestEstimated1RM, estimated1RM);

      exerciseTotalVolume += setVolume;
      exerciseTotalReps += reps;
      exerciseTotalSets += 1;
      exerciseBestEstimated1RM = Math.max(exerciseBestEstimated1RM, estimated1RM);

      if (rpe) {
        rpeTotal += rpe;
        rpeCount += 1;
        exerciseRpeTotal += rpe;
        exerciseRpeCount += 1;
      }

      primaryMuscles.forEach((muscle) => {
        const normalizedMuscle = normalizeMuscleName(muscle);
        muscleVolumeSummary[normalizedMuscle] = (muscleVolumeSummary[normalizedMuscle] || 0) + setVolume;
      });

      return {
        ...set,
        weight,
        reps,
        rpe,
        completed,
        setVolume,
        estimated1RM,
        bodyweightOnly,
        bodyweightUsed,
        addedLoad,
        totalLoad: weight
      };
    });

    return {
      ...exercise,
      sets: enrichedSets,
      exerciseTotalVolume,
      exerciseTotalReps,
      exerciseTotalSets,
      exerciseBestEstimated1RM: roundOne(exerciseBestEstimated1RM),
      exerciseAverageRPE: exerciseRpeCount ? roundOne(exerciseRpeTotal / exerciseRpeCount) : 0
    };
  });

  const muscleLoadSummary = calculateMuscleLoad(enrichedExercises);
  const groupedMuscleLoadSummary = groupMuscleLoadSummary(muscleLoadSummary);

  return {
    exercises: enrichedExercises,
    totalVolume,
    totalSets,
    totalReps,
    averageRPE: rpeCount ? roundOne(rpeTotal / rpeCount) : 0,
    heaviestWeight,
    bestEstimated1RM: roundOne(bestEstimated1RM),
    completedSetCount,
    failedSetCount,
    muscleVolumeSummary,
    muscleLoadSummary,
    groupedMuscleLoadSummary
  };
};
