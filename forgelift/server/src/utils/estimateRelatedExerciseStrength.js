import { confidenceRank, strengthEstimationRatios } from "./strengthEstimationRatios.js";

const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const getSuggestedWorkingWeight = ({ estimatedOneRepMax, exerciseType }) => {
  const multiplier = exerciseType === "isolation" ? 0.65 : 0.75;
  return roundOne(estimatedOneRepMax * multiplier);
};

export const estimateRelatedExerciseStrength = ({ baselineExerciseName, estimatedOneRepMax, exerciseLibrary = [] }) => {
  const ratios = strengthEstimationRatios[baselineExerciseName] || [];
  const exerciseMap = new Map(exerciseLibrary.map((exercise) => [exercise.name, exercise]));

  return ratios
    .map((ratio) => {
      const exercise = exerciseMap.get(ratio.exerciseName);
      if (!exercise) return null;

      const estimated = roundOne(estimatedOneRepMax * ratio.ratio);
      const suggestedRepRange = `${exercise.defaultRepMin || 6}-${exercise.defaultRepMax || 12} reps`;
      return {
        exerciseName: exercise.name,
        exerciseId: exercise._id,
        estimatedOneRepMax: estimated,
        workingWeight: getSuggestedWorkingWeight({
          estimatedOneRepMax: estimated,
          exerciseType: exercise.exerciseType
        }),
        reps: exercise.defaultRepMax || 12,
        suggestedWorkingWeight: getSuggestedWorkingWeight({
          estimatedOneRepMax: estimated,
          exerciseType: exercise.exerciseType
        }),
        suggestedRepRange,
        confidence: ratio.confidence,
        source: "estimated_from_baseline",
        sourceExerciseName: baselineExerciseName,
        ratioUsed: ratio.ratio,
        note:
          ratio.note ||
          "Estimated starting point based on your strength baseline. Adjust based on real performance.",
        updatedAt: new Date()
      };
    })
    .filter(Boolean);
};

export const mergeEstimatedBaselines = ({ userEnteredBaselines = [], estimatedBaselines = [] }) => {
  const merged = new Map();

  userEnteredBaselines.forEach((baseline) => {
    merged.set(baseline.exerciseName, baseline);
  });

  estimatedBaselines.forEach((baseline) => {
    if (merged.has(baseline.exerciseName)) return;

    const existing = [...merged.values()].find(
      (item) => item.source === "estimated_from_baseline" && item.exerciseName === baseline.exerciseName
    );

    if (!existing) {
      merged.set(`${baseline.exerciseName}:estimate`, baseline);
      return;
    }

    const shouldReplace =
      confidenceRank[baseline.confidence] > confidenceRank[existing.confidence] ||
      (confidenceRank[baseline.confidence] === confidenceRank[existing.confidence] &&
        baseline.estimatedOneRepMax > existing.estimatedOneRepMax);

    if (shouldReplace) {
      merged.delete(`${existing.exerciseName}:estimate`);
      merged.set(`${baseline.exerciseName}:estimate`, baseline);
    }
  });

  return [...merged.values()];
};
