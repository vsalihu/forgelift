import PersonalRecord from "../models/PersonalRecord.js";
import TrainingLoadStatus from "../models/TrainingLoadStatus.js";
import { calculateTrainingLoadStatus } from "./calculateTrainingLoadStatus.js";
import { normalizeMuscleName } from "./muscleTaxonomy.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACUTE_WINDOW_DAYS = 7;
const CHRONIC_WINDOW_DAYS = 28;
const STRENGTH_BASELINE_LOOKBACK_DAYS = 60;
const DIRECT_IMPACT_THRESHOLD = 60;

const exerciseKey = (exerciseId, exerciseName) =>
  exerciseId ? String(exerciseId) : `name:${(exerciseName || "").trim().toLowerCase()}`;

export const recalculateTrainingLoadFromWorkouts = async ({ user, workouts90d = [] }) => {
  const now = new Date();
  const acuteCutoff = new Date(now.getTime() - ACUTE_WINDOW_DAYS * DAY_MS);
  const chronicCutoff = new Date(now.getTime() - CHRONIC_WINDOW_DAYS * DAY_MS);
  const strengthCutoff = new Date(now.getTime() - STRENGTH_BASELINE_LOOKBACK_DAYS * DAY_MS);

  const chronicWorkouts = workouts90d.filter((workout) => new Date(workout.date) >= chronicCutoff);

  const muscleAcuteLoad = {};
  const muscleChronicLoad = {};
  const muscleEarliestDate = {};
  const muscleExercises = {};

  chronicWorkouts.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    const isAcute = workoutDate >= acuteCutoff;

    Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
      const total = (load.directLoad || 0) + (load.indirectLoad || 0) + (load.stabiliserLoad || 0);
      muscleChronicLoad[muscle] = (muscleChronicLoad[muscle] || 0) + total;
      if (isAcute) muscleAcuteLoad[muscle] = (muscleAcuteLoad[muscle] || 0) + total;
      if (!muscleEarliestDate[muscle] || workoutDate < muscleEarliestDate[muscle]) {
        muscleEarliestDate[muscle] = workoutDate;
      }
    });
  });

  // Which exercises train which muscle isn't limited to the chronic window: a
  // muscle can still have a strength trend from exercises done a while ago.
  // Muscle keys must match muscleLoadSummary, which is keyed by impactProfile,
  // so heavily-loaded impactProfile muscles count alongside primaryMuscles.
  workouts90d.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const muscles = new Set((exercise.primaryMuscles || []).map(normalizeMuscleName));
      Object.entries(exercise.impactProfile || {}).forEach(([rawMuscle, impact]) => {
        if (Number(impact) >= DIRECT_IMPACT_THRESHOLD) muscles.add(normalizeMuscleName(rawMuscle));
      });

      muscles.forEach((muscle) => {
        muscleExercises[muscle] = muscleExercises[muscle] || new Set();
        muscleExercises[muscle].add(exerciseKey(exercise.exerciseId, exercise.exerciseName));
      });
    });
  });

  const allExerciseKeys = new Set(Object.values(muscleExercises).flatMap((set) => [...set]));

  const personalRecords = await PersonalRecord.find({
    userId: user._id,
    recordType: "best_estimated_1rm"
  })
    .sort({ achievedAt: 1 })
    .select("exerciseId exerciseName value achievedAt");

  const prSeriesByExercise = new Map();
  personalRecords.forEach((record) => {
    const key = exerciseKey(record.exerciseId, record.exerciseName);
    if (!allExerciseKeys.has(key)) return;
    const series = prSeriesByExercise.get(key) || [];
    series.push({ value: record.value, achievedAt: record.achievedAt });
    prSeriesByExercise.set(key, series);
  });

  const strengthPointForExercise = (key) => {
    const series = prSeriesByExercise.get(key);
    if (!series || series.length < 2) return null;

    const current = series[series.length - 1].value;
    const baselineCandidate = [...series].reverse().find((point) => new Date(point.achievedAt) <= strengthCutoff);
    const baseline = baselineCandidate ? baselineCandidate.value : series[0].value;

    return { current, baseline };
  };

  const results = await Promise.all(
    Object.keys(muscleChronicLoad).map(async (muscleGroup) => {
      const exerciseKeys = [...(muscleExercises[muscleGroup] || [])];
      const strengthDataPoints = exerciseKeys.map((key) => strengthPointForExercise(key)).filter(Boolean);
      const earliestDate = muscleEarliestDate[muscleGroup];
      const chronicWindowDays = earliestDate
        ? Math.min(CHRONIC_WINDOW_DAYS, Math.round((now.getTime() - earliestDate.getTime()) / DAY_MS))
        : 0;

      const status = calculateTrainingLoadStatus({
        muscleGroup,
        acuteLoad: muscleAcuteLoad[muscleGroup] || 0,
        chronicLoad: muscleChronicLoad[muscleGroup] || 0,
        chronicWindowDays,
        strengthDataPoints
      });

      return TrainingLoadStatus.findOneAndUpdate(
        { userId: user._id, muscleGroup },
        { $set: { userId: user._id, ...status } },
        { new: true, upsert: true }
      );
    })
  );

  return results.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
};
