import Exercise from "../models/Exercise.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import RecoveryScore from "../models/RecoveryScore.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { generateOverloadRecommendation, roundToPlate } from "./generateOverloadRecommendation.js";

const getPreviousWorkoutExercises = async ({ userId, exerciseName, workoutId }) => {
  const workouts = await Workout.find({
    userId,
    _id: { $ne: workoutId },
    "exercises.exerciseName": exerciseName
  })
    .sort({ date: -1, createdAt: -1 })
    .limit(4);

  return workouts
    .map((workout) => workout.exercises.find((exercise) => exercise.exerciseName === exerciseName))
    .filter(Boolean);
};

export const updateOverloadRecommendations = async ({ user, workout = null }) => {
  const latestWorkout =
    workout ||
    (await Workout.findOne({ userId: user._id }).sort({
      date: -1,
      createdAt: -1
    }));

  if (!latestWorkout) return [];

  const [recoveryScores, weakPoints, trainingBalance, activeDeloads] = await Promise.all([
    RecoveryScore.find({ userId: user._id }),
    WeakPoint.find({ userId: user._id, active: true }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 }),
    DeloadRecommendation.find({ userId: user._id, status: "active" })
  ]);

  // One recommendation per exercise name (the last entry wins if a workout lists it twice), so the
  // exercises can be worked out in parallel without two of them racing on the same recommendation.
  const byName = new Map();
  (latestWorkout.exercises || []).forEach((workoutExercise) => {
    if (workoutExercise.exerciseName) byName.set(workoutExercise.exerciseName, workoutExercise);
  });

  const buildOne = async (workoutExercise) => {
    const [exercise, previousWorkoutExercises] = await Promise.all([
      workoutExercise.exerciseId ? Exercise.findById(workoutExercise.exerciseId) : Exercise.findOne({ name: workoutExercise.exerciseName }),
      getPreviousWorkoutExercises({
        userId: user._id,
        exerciseName: workoutExercise.exerciseName,
        workoutId: latestWorkout._id
      })
    ]);
    const recommendation = generateOverloadRecommendation({
      user,
      exercise,
      latestWorkoutExercise: workoutExercise,
      previousWorkoutExercises,
      recoveryScores,
      weakPoints,
      trainingBalance
    });
    const matchingDeload = activeDeloads.find(
      (deload) =>
        deload.exerciseName === recommendation.exerciseName ||
        (deload.muscleGroup && recommendation.muscleGroups?.includes(deload.muscleGroup)) ||
        deload.scope === "full_body"
    );

    if (matchingDeload) {
      // Follow the deload instead of pushing progression on top of it.
      const unit = recommendation.unit || "kg";
      const current = recommendation.currentWeight || 0;
      const reduction = Number(matchingDeload.reductionPercentage) || 0;
      const isVolumeDeload = matchingDeload.recommendationType === "volume_deload";
      const deloadWeight =
        matchingDeload.exerciseName === recommendation.exerciseName && matchingDeload.recommendedWeight > 0
          ? matchingDeload.recommendedWeight
          : !isVolumeDeload && reduction > 0 && current > 0
            ? roundToPlate(current * (1 - reduction / 100), unit)
            : current;
      const sets = recommendation.recommendedSets || 3;

      recommendation.recommendationType = "deload_flag";
      recommendation.recommendedWeight = deloadWeight;
      recommendation.recommendedSets = isVolumeDeload && reduction > 0 ? Math.max(1, Math.round(sets * (1 - reduction / 100))) : sets;
      recommendation.recommendedRepTarget = "Easy reps, 2-3 left in the tank";
      recommendation.reason =
        deloadWeight < current
          ? `Deload in progress: use ${deloadWeight} ${unit} instead of ${current} ${unit} and keep every set easy. Progression picks up again when the deload ends.`
          : `Deload in progress: keep ${current} ${unit} with fewer, easier sets. Progression picks up again when the deload ends.`;
      recommendation.detailedReasons = [...(recommendation.detailedReasons || []), matchingDeload.reason].filter(Boolean);
    }

    await OverloadRecommendation.updateMany(
      { userId: user._id, exerciseName: recommendation.exerciseName, status: "active" },
      { $set: { status: "expired" } }
    );

    return OverloadRecommendation.create({
      userId: user._id,
      workoutId: latestWorkout._id,
      ...recommendation,
      status: "active"
    });
  };

  return Promise.all([...byName.values()].map(buildOne));
};
