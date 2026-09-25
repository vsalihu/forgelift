import CalendarEntry from "../models/CalendarEntry.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Exercise from "../models/Exercise.js";
import TrainingPlan from "../models/TrainingPlan.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const READINESS_DAYS_NEEDED = 14;
const READINESS_WORKOUT_DAYS_NEEDED = 4;
const HISTORY_WINDOW_DAYS = 90;

const startOfUTCDay = (date) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
};

const addDays = (date, amount) => new Date(date.getTime() + amount * DAY_MS);
const dateKey = (date) => startOfUTCDay(date).toISOString().slice(0, 10);
const mean = (values) => (values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const WEEKDAY_TEMPLATES = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6]
};

// If the user has trained on `avgWorkoutsPerWeek` distinct weekdays recently, keep that
// exact weekday -> muscle-cluster pairing (e.g. "Legs on Monday" stays on Monday). Only
// fall back to an evenly-spaced template, assigning clusters by sequence, when the recent
// history doesn't cover enough distinct weekdays to pin down a real weekly pattern.
const resolveWeekPlan = ({ avgWorkoutsPerWeek, weekdayClusterMap, rotation }) => {
  if (weekdayClusterMap.size === avgWorkoutsPerWeek) {
    const weekdaySlots = [...weekdayClusterMap.keys()].sort((a, b) => a - b);
    return { weekdaySlots, getCluster: (weekday) => weekdayClusterMap.get(weekday) };
  }

  const weekdaySlots = WEEKDAY_TEMPLATES[clamp(avgWorkoutsPerWeek, 1, 6)];
  return {
    weekdaySlots,
    getCluster: (weekday) => rotation[weekdaySlots.indexOf(weekday) % rotation.length] || ["Full Body"]
  };
};

const dominantGroups = (groupedMuscleLoadSummary = {}, max = 2) => {
  const groups = Object.entries(groupedMuscleLoadSummary)
    .filter(([group, load]) => group !== "Cardio" && (load.directLoad || 0) > 0)
    .sort((a, b) => (b[1].directLoad || 0) - (a[1].directLoad || 0))
    .slice(0, max)
    .map(([group]) => group);
  return groups.length ? groups : ["Full Body"];
};

export const getTrainingReadiness = async (userId) => {
  const firstWorkout = await Workout.findOne({ userId }).sort({ date: 1 }).select("date");

  if (!firstWorkout) {
    return {
      unlocked: false,
      daysLogged: 0,
      daysNeeded: READINESS_DAYS_NEEDED,
      workoutDaysLogged: 0,
      workoutDaysNeeded: READINESS_WORKOUT_DAYS_NEEDED
    };
  }

  const daysLogged = Math.max(1, Math.floor((Date.now() - firstWorkout.date.getTime()) / DAY_MS) + 1);
  const workouts = await Workout.find({ userId }).select("date");
  const workoutDaysLogged = new Set(workouts.map((workout) => dateKey(workout.date))).size;

  return {
    unlocked: daysLogged >= READINESS_DAYS_NEEDED && workoutDaysLogged >= READINESS_WORKOUT_DAYS_NEEDED,
    daysLogged,
    daysNeeded: READINESS_DAYS_NEEDED,
    workoutDaysLogged,
    workoutDaysNeeded: READINESS_WORKOUT_DAYS_NEEDED
  };
};

const analyzeTrainingPattern = async (userId) => {
  const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * DAY_MS);
  const workouts = await Workout.find({ userId, date: { $gte: since } }).sort({ date: 1 });

  if (!workouts.length) return null;

  const weeksSpanned = Math.max(1, (Date.now() - workouts[0].date.getTime()) / (7 * DAY_MS));
  const avgWorkoutsPerWeek = clamp(Math.round(workouts.length / weeksSpanned), 1, 6);
  const avgExercisesPerWorkout = clamp(Math.round(mean(workouts.map((workout) => workout.exercises.length))), 1, 8);
  const avgSetsPerExercise = clamp(
    Math.round(mean(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.sets.length)))),
    2,
    5
  );

  const recentWorkouts = workouts.slice(-avgWorkoutsPerWeek);
  const rotation = recentWorkouts.map((workout) => dominantGroups(workout.groupedMuscleLoadSummary));
  const weekdayClusterMap = new Map();
  recentWorkouts.forEach((workout) => {
    weekdayClusterMap.set(workout.date.getUTCDay(), dominantGroups(workout.groupedMuscleLoadSummary));
  });

  const exerciseFrequency = new Map();
  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exerciseFrequency.set(exercise.exerciseName, (exerciseFrequency.get(exercise.exerciseName) || 0) + 1);
    });
  });

  return { avgWorkoutsPerWeek, avgExercisesPerWorkout, avgSetsPerExercise, rotation, weekdayClusterMap, exerciseFrequency };
};

const resolveTemplateMatches = async (userId) => {
  const templates = await WorkoutTemplate.find({ userId });
  if (!templates.length) return [];

  const exerciseNames = [...new Set(templates.flatMap((template) => template.exercises.map((exercise) => exercise.exerciseName)))];
  const exerciseIds = [...new Set(templates.flatMap((template) => template.exercises.map((exercise) => exercise.exerciseId).filter(Boolean)))];
  const libraryExercises = await Exercise.find({ $or: [{ _id: { $in: exerciseIds } }, { name: { $in: exerciseNames } }] });
  const byId = new Map(libraryExercises.map((exercise) => [String(exercise._id), exercise]));
  const byName = new Map(libraryExercises.map((exercise) => [exercise.name, exercise]));

  return templates
    .map((template) => {
      const groupCounts = {};
      template.exercises.forEach((templateExercise) => {
        const libraryExercise =
          (templateExercise.exerciseId && byId.get(String(templateExercise.exerciseId))) || byName.get(templateExercise.exerciseName);
        (libraryExercise?.mainMuscleGroups || []).forEach((group) => {
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
      });
      const groups = Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([group]) => group);
      return { template, groups };
    })
    .filter((match) => match.groups.length);
};

const findBestTemplate = (templateMatches, cluster) => {
  const ranked = templateMatches
    .map((match) => ({ ...match, overlap: match.groups.filter((group) => cluster.includes(group)).length }))
    .filter((match) => match.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);
  return ranked[0]?.template || null;
};

const pickExercisesForCluster = async ({ groups, count, exerciseFrequency, userId, setsPerExercise }) => {
  const exercises = await Exercise.find({
    mainMuscleGroups: { $in: groups },
    $or: [{ isDefault: true }, { isCustom: { $ne: true } }, { createdBy: userId }, { visibility: "public" }]
  });

  return exercises
    .map((exercise) => ({ exercise, frequency: exerciseFrequency.get(exercise.name) || 0 }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, count)
    .map(({ exercise }) => ({
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      targetSets: setsPerExercise,
      targetRepMin: exercise.defaultRepMin || 8,
      targetRepMax: exercise.defaultRepMax || 12
    }));
};

const buildSplitSummary = (rotation, avgWorkoutsPerWeek) =>
  `${avgWorkoutsPerWeek}x/week: ${rotation.map((cluster) => cluster.join(" & ")).join(" -> ")}`;

const buildWeekEntries = async ({
  weekStartDate,
  isDeloadWeek,
  weekPlan,
  templateMatches,
  pattern,
  userId,
  planId,
  manualDateKeys
}) => {
  const entries = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(weekStartDate, offset);
    const key = dateKey(date);
    if (manualDateKeys.has(key)) continue;

    const weekday = date.getUTCDay();

    if (!weekPlan.weekdaySlots.includes(weekday)) {
      entries.push({ userId, date, type: "rest", source: "generated", planId });
      continue;
    }

    const cluster = weekPlan.getCluster(weekday);
    const matchedTemplate = findBestTemplate(templateMatches, cluster);

    if (matchedTemplate) {
      entries.push({
        userId,
        date,
        type: "planned_workout",
        source: "generated",
        planId,
        workoutTemplateId: matchedTemplate._id,
        plannedTitle: matchedTemplate.name,
        muscleGroups: cluster,
        isDeloadWeek
      });
      continue;
    }

    const setsPerExercise = isDeloadWeek ? Math.max(2, Math.round(pattern.avgSetsPerExercise * 0.7)) : pattern.avgSetsPerExercise;
    const exercises = await pickExercisesForCluster({
      groups: cluster,
      count: pattern.avgExercisesPerWorkout,
      exerciseFrequency: pattern.exerciseFrequency,
      userId,
      setsPerExercise
    });

    entries.push({
      userId,
      date,
      type: "planned_workout",
      source: "generated",
      planId,
      plannedTitle: `${cluster.join(" & ")} Day`,
      plannedExercises: exercises,
      muscleGroups: cluster,
      isDeloadWeek
    });
  }

  return entries;
};

const getManualDateKeys = async (userId, rangeStart, rangeEnd) => {
  const existing = await CalendarEntry.find({
    userId,
    source: "manual",
    date: { $gte: rangeStart, $lte: rangeEnd }
  }).select("date");
  return new Set(existing.map((entry) => dateKey(entry.date)));
};

const writeEntries = async (entries) => {
  if (!entries.length) return;
  await CalendarEntry.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { userId: entry.userId, date: entry.date },
        update: { $set: entry },
        upsert: true
      }
    }))
  );
};

export const generateNewPlan = async (user, durationWeeks) => {
  const pattern = await analyzeTrainingPattern(user._id);
  if (!pattern) {
    const error = new Error("Not enough workout history yet to generate a plan.");
    error.statusCode = 400;
    throw error;
  }

  const templateMatches = await resolveTemplateMatches(user._id);
  const activeDeload = await DeloadRecommendation.findOne({ userId: user._id, scope: "full_body", status: "active" });

  const startDate = addDays(startOfUTCDay(new Date()), 1);
  const endDate = addDays(startDate, durationWeeks * 7 - 1);

  await TrainingPlan.updateMany({ userId: user._id, status: "active" }, { status: "cancelled" });
  await CalendarEntry.deleteMany({ userId: user._id, source: "generated", date: { $gte: startDate } });

  const plan = await TrainingPlan.create({
    userId: user._id,
    startDate,
    endDate,
    durationWeeks,
    status: "active",
    splitSummary: buildSplitSummary(pattern.rotation, pattern.avgWorkoutsPerWeek),
    workoutsPerWeek: pattern.avgWorkoutsPerWeek
  });

  const weekPlan = resolveWeekPlan(pattern);
  const manualDateKeys = await getManualDateKeys(user._id, startDate, endDate);
  const deloadWeekIndex = activeDeload ? 0 : durationWeeks >= 4 ? durationWeeks - 1 : -1;

  for (let week = 0; week < durationWeeks; week += 1) {
    const weekStartDate = addDays(startDate, week * 7);
    // eslint-disable-next-line no-await-in-loop
    const entries = await buildWeekEntries({
      weekStartDate,
      isDeloadWeek: week === deloadWeekIndex,
      weekPlan,
      templateMatches,
      pattern,
      userId: user._id,
      planId: plan._id,
      manualDateKeys
    });
    // eslint-disable-next-line no-await-in-loop
    await writeEntries(entries);
  }

  return plan;
};

export const regeneratePlanRemainder = async (user, plan) => {
  const pattern = await analyzeTrainingPattern(user._id);
  if (!pattern) {
    const error = new Error("Not enough workout history yet to regenerate this plan.");
    error.statusCode = 400;
    throw error;
  }

  const templateMatches = await resolveTemplateMatches(user._id);
  const activeDeload = await DeloadRecommendation.findOne({ userId: user._id, scope: "full_body", status: "active" });

  const today = startOfUTCDay(new Date());
  const rangeStart = plan.startDate > today ? plan.startDate : today;
  if (rangeStart > plan.endDate) return plan;

  await CalendarEntry.deleteMany({ userId: user._id, planId: plan._id, source: "generated", date: { $gte: rangeStart } });

  const weekPlan = resolveWeekPlan(pattern);
  const manualDateKeys = await getManualDateKeys(user._id, rangeStart, plan.endDate);
  const totalWeeks = plan.durationWeeks;
  const deloadWeekIndex = activeDeload ? Math.floor((rangeStart - plan.startDate) / (7 * DAY_MS)) : totalWeeks >= 4 ? totalWeeks - 1 : -1;

  let weekStartDate = addDays(plan.startDate, Math.floor((rangeStart - plan.startDate) / (7 * DAY_MS)) * 7);
  let weekIndex = Math.floor((weekStartDate - plan.startDate) / (7 * DAY_MS));

  while (weekStartDate <= plan.endDate) {
    // eslint-disable-next-line no-await-in-loop
    const entries = await buildWeekEntries({
      weekStartDate,
      isDeloadWeek: weekIndex === deloadWeekIndex,
      weekPlan,
      templateMatches,
      pattern,
      userId: user._id,
      planId: plan._id,
      manualDateKeys
    });
    // eslint-disable-next-line no-await-in-loop
    await writeEntries(entries.filter((entry) => entry.date >= rangeStart));
    weekStartDate = addDays(weekStartDate, 7);
    weekIndex += 1;
  }

  return plan;
};

export { addDays, dateKey, startOfUTCDay };
