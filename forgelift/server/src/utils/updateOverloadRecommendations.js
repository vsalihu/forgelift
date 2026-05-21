import Exercise from "../models/Exercise.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import RecoveryScore from "../models/RecoveryScore.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { generateOverloadRecommendation } from "./generateOverloadRecommendation.js";

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

  const savedRecommendations = [];

  for (const workoutExercise of latestWorkout.exercises || []) {
    const exercise = workoutExercise.exerciseId
      ? await Exercise.findById(workoutExercise.exerciseId)
      : await Exercise.findOne({ name: workoutExercise.exerciseName });
    const previousWorkoutExercises = await getPreviousWorkoutExercises({
      userId: user._id,
      exerciseName: workoutExercise.exerciseName,
      workoutId: latestWorkout._id
    });
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
      recommendation.warnings = [
        ...(recommendation.warnings || []),
        "Deload recommendation active. Do not follow aggressive overload until deload is completed."
      ];
      recommendation.detailedReasons = [
        ...(recommendation.detailedReasons || []),
        `${matchingDeload.reason}`
      ];

      if (recommendation.recommendationType === "increase_weight") {
        recommendation.recommendationType = "repeat_weight";
        recommendation.recommendedWeight = recommendation.currentWeight;
        recommendation.reason = "Repeat or reduce load because an active deload recommendation is present.";
      }
    }

    await OverloadRecommendation.updateMany(
      { userId: user._id, exerciseName: recommendation.exerciseName, status: "active" },
      { $set: { status: "expired" } }
    );

    const savedRecommendation = await OverloadRecommendation.create({
      userId: user._id,
      workoutId: latestWorkout._id,
      ...recommendation,
      status: "active"
    });
    savedRecommendations.push(savedRecommendation);
  }

  return savedRecommendations;
};
