import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import ActivityFeedItem from "../models/ActivityFeedItem.js";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import BodyweightEntry from "../models/BodyweightEntry.js";
import CalendarEntry from "../models/CalendarEntry.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Exercise from "../models/Exercise.js";
import Mission from "../models/Mission.js";
import MonthlyReport from "../models/MonthlyReport.js";
import MuscleRank from "../models/MuscleRank.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import RecoveryScore from "../models/RecoveryScore.js";
import Streak from "../models/Streak.js";
import TrainingBalance from "../models/TrainingBalance.js";
import TrainingLoadStatus from "../models/TrainingLoadStatus.js";
import TrainingPlan from "../models/TrainingPlan.js";
import User from "../models/User.js";
import WeakPoint from "../models/WeakPoint.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { buildOneRepMaxLookup } from "./buildOneRepMaxLookup.js";
import { calculateWorkoutStats } from "./calculateWorkoutStats.js";
import { detectPersonalRecords } from "./detectPersonalRecords.js";
import { generateMonthlyReport } from "./generateMonthlyReport.js";
import { generateNewPlan, getTrainingReadiness } from "./generateTrainingPlan.js";
import { recalculateUserTrainingState } from "./recalculateUserTrainingState.js";
import { seedExercises } from "./seedExercises.js";

dotenv.config();

const DAY_MS = 24 * 60 * 60 * 1000;
const BODYWEIGHT = 82;

const roundTo = (value, step = 2.5) => Math.round(value / step) * step;

// Deterministic PRNG so every run produces the same history.
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const utcDay = (year, monthIndex, day) => new Date(Date.UTC(year, monthIndex, day));
const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const startOfUTCDay = (date) => utcDay(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

// start = kg at week 0, gain = kg added per week, stallAt = weight cap (progress stops there).
// dropAfterWeek = stop doing it after that week index.
const EXERCISES = {
  "Bench Press": { start: 75, gain: 1.4, sets: 4, reps: [8, 8, 7, 6] },
  "Incline Dumbbell Press": { start: 26, gain: 0.5, sets: 3, reps: [10, 9, 9] },
  "Incline Bench Press": { start: 60, gain: 1.1, sets: 3, reps: [8, 8, 7] },
  "Overhead Press": { start: 47.5, gain: 0.8, sets: 4, reps: [7, 6, 6, 5], stallAt: 50 },
  "Lateral Raise": { start: 8, gain: 1, sets: 3, reps: [14, 13, 12], stallAt: 10 },
  "Cable Fly": { start: 15, gain: 0.4, sets: 3, reps: [12, 12, 11] },
  "Tricep Pushdown": { start: 33, gain: 0.6, sets: 3, reps: [12, 11, 10], stallAt: 34 },
  "Skull Crusher": { start: 33, gain: 0.6, sets: 3, reps: [10, 10, 9], stallAt: 34 },
  "Barbell Row": { start: 70, gain: 1.2, sets: 4, reps: [9, 8, 8, 7] },
  "Lat Pulldown": { start: 60, gain: 1, sets: 3, reps: [10, 10, 9] },
  "Face Pull": { start: 25, gain: 0.6, sets: 3, reps: [15, 14, 13] },
  "Seated Cable Row": { start: 55, gain: 1.1, sets: 3, reps: [11, 10, 10] },
  "Pull-up": { start: 0, gain: 0.8, sets: 3, reps: [8, 7, 6], bodyweight: true },
  "Bicep Curl": { start: 17, gain: 0.6, sets: 3, reps: [11, 10, 10], stallAt: 18 },
  "Hammer Curl": { start: 17, gain: 0.6, sets: 3, reps: [11, 10, 10], stallAt: 18 },
  Squat: { start: 100, gain: 2.2, sets: 4, reps: [7, 7, 6, 6] },
  "Romanian Deadlift": { start: 90, gain: 1.8, sets: 3, reps: [10, 9, 9] },
  "Leg Press": { start: 160, gain: 4.5, sets: 3, reps: [12, 12, 11] },
  "Calf Raise": { start: 70, gain: 1.4, sets: 4, reps: [14, 13, 12, 12], stallAt: 75, dropAfterWeek: 10 },
  Deadlift: { start: 120, gain: 2.3, sets: 3, reps: [5, 5, 4] },
  "Cable Crunch": { start: 35, gain: 1.1, sets: 3, reps: [14, 13, 12] }
};

const SESSIONS = {
  1: { title: "Push A", exercises: ["Bench Press", "Incline Dumbbell Press", "Overhead Press", "Lateral Raise", "Tricep Pushdown"] },
  2: { title: "Pull A", exercises: ["Barbell Row", "Lat Pulldown", "Face Pull", "Bicep Curl"] },
  3: { title: "Legs", exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Calf Raise", "Cable Crunch"] },
  5: { title: "Push B", exercises: ["Overhead Press", "Incline Bench Press", "Cable Fly", "Lateral Raise", "Skull Crusher"] },
  6: { title: "Pull B", exercises: ["Deadlift", "Pull-up", "Seated Cable Row", "Hammer Curl", "Cable Crunch"] }
};

const TEMPLATES = [
  { name: "Push A", exercises: SESSIONS[1].exercises },
  { name: "Pull A", exercises: SESSIONS[2].exercises },
  { name: "Legs", exercises: SESSIONS[3].exercises }
];

export const REQUIRED_EXERCISE_NAMES = [...new Set(Object.values(SESSIONS).flatMap((session) => session.exercises))];


// A one-off high-volume shoulders-and-back session in the final week: a realistic
// load spike that the Training Load page should flag.
const SPIKE_SESSION = {
  title: "Extra Shoulders & Back (high volume)",
  exercises: [
    ["Overhead Press", 9],
    ["Lateral Raise", 6],
    ["Face Pull", 4],
    ["Barbell Row", 7],
    ["Lat Pulldown", 6]
  ]
};

const DELOAD_WEEKS = new Set([5, 10]);

const buildSets = ({ config, weekIndex, isDeload, isBodyweight, rng, sessionEffort }) => {
  const progressed = config.start + config.gain * weekIndex;
  const capped = config.stallAt ? Math.min(progressed, config.stallAt) : progressed;
  const step = config.start >= 40 ? 2.5 : config.start >= 10 ? 1 : 0.5;
  const workingWeight = isBodyweight ? roundTo(capped, 2.5) : roundTo(capped * (isDeload ? 0.85 : 1), step);

  const setCount = isDeload ? Math.max(2, config.sets - 1) : config.sets;

  return Array.from({ length: setCount }, (_, index) => {
    const baseReps = config.reps[Math.min(index, config.reps.length - 1)];
    const reps = Math.max(3, baseReps + (isDeload ? 2 : 0) - (rng() < 0.15 ? 1 : 0));
    const rpe = Math.min(10, Math.round((sessionEffort + index * 0.3 + (isDeload ? -1.5 : 0)) * 2) / 2);
    return {
      weight: workingWeight,
      reps,
      rpe,
      completed: !(sessionEffort >= 9 && index === setCount - 1 && rng() < 0.4),
      bodyweightOnly: isBodyweight,
      bodyweightUsed: isBodyweight ? BODYWEIGHT : null,
      addedLoad: isBodyweight ? workingWeight : null
    };
  });
};

// Pure and deterministic: returns the sessions and calendar entries for [startDate, endDate].
export const buildTrainingHistory = ({ startDate, endDate }) => {
  const rng = mulberry32(2026);
  const sessions = [];
  const calendarEntries = [];
  const recentCutoff = addDays(endDate, -10);
  let sundayCount = 0;

  for (let date = startOfUTCDay(startDate); date <= endDate; date = addDays(date, 1)) {
    const weekday = date.getUTCDay();
    const weekIndex = Math.floor((date.getTime() - startDate.getTime()) / (7 * DAY_MS));
    const template = SESSIONS[weekday];

    if (template) {
      const skipRoll = rng();
      if (skipRoll < 0.08 && date < recentCutoff) continue;

      const isDeload = DELOAD_WEEKS.has(weekIndex);
      const sessionEffort = isDeload ? 6.5 : 7.5 + rng() * 1.5;
      const exercises = template.exercises
        .filter((name) => !(EXERCISES[name].dropAfterWeek !== undefined && weekIndex > EXERCISES[name].dropAfterWeek))
        .map((name) => ({
          name,
          sets: buildSets({
            config: EXERCISES[name],
            weekIndex,
            isDeload,
            isBodyweight: Boolean(EXERCISES[name].bodyweight),
            rng,
            sessionEffort
          })
        }));

      if (date.getTime() + 12 * 60 * 60 * 1000 > Date.now()) continue;

      sessions.push({
        title: isDeload ? `${template.title} (Deload)` : template.title,
        date: new Date(date.getTime() + 12 * 60 * 60 * 1000),
        notes: isDeload ? "Deload week: lighter weights, fewer sets." : "",
        sessionRPE: Math.round(sessionEffort * 2) / 2,
        soreness: Math.min(9, Math.max(2, Math.round(3 + sessionEffort - 6 + rng() * 2))),
        sleepQuality: Math.round(5 + rng() * 3),
        energyLevel: Math.round(5 + rng() * 3),
        exercises
      });
    } else if (weekday === 0 && date > addDays(endDate, -7) && date.getTime() + 12 * 60 * 60 * 1000 <= Date.now()) {
      const sessionEffort = 8.5;
      sessions.push({
        title: SPIKE_SESSION.title,
        date: new Date(date.getTime() + 12 * 60 * 60 * 1000),
        notes: "Extra session to push shoulders and back harder this week.",
        sessionRPE: 9,
        soreness: 7,
        sleepQuality: 6,
        energyLevel: 6,
        exercises: SPIKE_SESSION.exercises.map(([name, setCount]) => ({
          name,
          sets: buildSets({
            config: { ...EXERCISES[name], sets: setCount },
            weekIndex,
            isDeload: false,
            isBodyweight: false,
            rng,
            sessionEffort
          })
        }))
      });
    } else if (weekday === 0) {
      sundayCount += 1;
      calendarEntries.push(
        sundayCount % 2 === 0
          ? { date, type: "treatment", notes: "Massage and mobility session" }
          : { date, type: "rest", notes: "Full rest day" }
      );
    } else if (weekday === 4 && rng() < 0.6) {
      calendarEntries.push({ date, type: "rest", notes: "Active recovery: walk and stretch" });
    }
  }

  return { sessions, calendarEntries };
};

export const hydrateSessionExercises = (exerciseMap, sessionExercises) =>
  sessionExercises.map(({ name, sets }) => {
    const library = exerciseMap.get(name);
    if (!library) throw new Error(`Exercise missing from library: ${name}`);

    return {
      exerciseId: library._id,
      exerciseName: library.name,
      exerciseType: library.exerciseType || "",
      mainMuscleGroups: library.mainMuscleGroups || [],
      detailedMuscles: library.detailedMuscles || [],
      primaryMuscles: library.primaryMuscles || [],
      secondaryMuscles: library.secondaryMuscles || [],
      stabiliserMuscles: library.stabiliserMuscles || [],
      impactProfile: library.impactProfile || {},
      sets: sets.map((set) => {
        const totalLoad = set.bodyweightOnly ? set.bodyweightUsed + (set.addedLoad || 0) : set.weight;
        return { ...set, weight: totalLoad, totalLoad, notes: "" };
      })
    };
  });

const wipeAccountData = async (userId) => {
  const models = [
    ActivityFeedItem, AnalyticsSnapshot, BodyweightEntry, CalendarEntry, DeloadRecommendation, Mission,
    MonthlyReport, MuscleRank, OverloadRecommendation, PersonalRecord, RecoveryScore, Streak,
    TrainingBalance, TrainingLoadStatus, TrainingPlan, WeakPoint, WeeklyTarget, Workout, WorkoutTemplate
  ];
  await Promise.all(models.map((model) => model.deleteMany({ userId })));
};

const defaultStartDate = () => utcDay(new Date().getUTCFullYear(), 6, 1);

export const seedTestAccount = async ({
  email = "test@gmail.com",
  password = "Test123",
  username = "testuser",
  name = "Test Athlete",
  startDate = defaultStartDate()
} = {}) => {
  const normalizedEmail = email.toLowerCase();
  const endDate = startOfUTCDay(new Date());
  const passwordHash = await bcrypt.hash(password, 12);

  const existingLibrary = await Exercise.find({ name: { $in: REQUIRED_EXERCISE_NAMES } });
  if (existingLibrary.length < REQUIRED_EXERCISE_NAMES.length) await seedExercises();
  const library = await Exercise.find({ name: { $in: REQUIRED_EXERCISE_NAMES } });
  const exerciseMap = new Map(library.map((exercise) => [exercise.name, exercise]));

  const usernameOwner = await User.findOne({ username });
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (usernameOwner && (!existingUser || !usernameOwner._id.equals(existingUser._id))) {
    throw new Error(`The username "${username}" is already taken by a different account. Set SEED_USERNAME to another value.`);
  }

  const profile = {
    name,
    email: normalizedEmail,
    username,
    passwordHash,
    gender: "male",
    selectedStrengthStandard: "male",
    age: 27,
    height: 180,
    bodyweight: BODYWEIGHT,
    lastBodyweightCheckInAt: new Date(),
    preferredUnits: "metric",
    trainingExperience: "Intermediate",
    goalPath: "Muscle Builder",
    onboardingCompleted: true,
    assessmentCompleted: true,
    assessmentCompletedAt: startDate,
    assessmentSummary: {
      determinedLevel: "Intermediate",
      confidence: "Medium",
      mainGoal: "Muscle Builder",
      trainingAgeMonths: 30,
      weeklyTrainingFrequency: 5,
      strongestLift: "Squat",
      weakestArea: "Arms",
      recommendationSummary: "Solid base. Keep progressive overload consistent and balance push, pull and legs."
    },
    xp: 0,
    overallRankScore: 0,
    currentOverallRank: "Copper",
    lifetimeVolume: 0,
    lifetimeReps: 0,
    lifetimeSets: 0,
    lifetimeWorkoutCount: 0,
    beginnerTipsEnabled: false,
    strengthBaselines: [
      { exerciseName: "Bench Press", estimatedOneRepMax: 95, workingWeight: 75, reps: 8, source: "user_entered", confidence: "High" },
      { exerciseName: "Squat", estimatedOneRepMax: 125, workingWeight: 100, reps: 7, source: "user_entered", confidence: "High" },
      { exerciseName: "Deadlift", estimatedOneRepMax: 150, workingWeight: 120, reps: 5, source: "user_entered", confidence: "High" },
      { exerciseName: "Overhead Press", estimatedOneRepMax: 57, workingWeight: 45, reps: 7, source: "user_entered", confidence: "High" }
    ]
  };

  const user = existingUser
    ? Object.assign(existingUser, profile)
    : new User(profile);
  await user.save();
  await wipeAccountData(user._id);

  const { sessions, calendarEntries } = buildTrainingHistory({ startDate, endDate });

  for (const session of sessions) {
    const oneRepMaxLookup = await buildOneRepMaxLookup(user._id, user.strengthBaselines);
    const exercises = hydrateSessionExercises(exerciseMap, session.exercises);
    const stats = calculateWorkoutStats(exercises, oneRepMaxLookup);
    const workout = await Workout.create({
      userId: user._id,
      title: session.title,
      date: session.date,
      notes: session.notes,
      sessionRPE: session.sessionRPE,
      soreness: session.soreness,
      sleepQuality: session.sleepQuality,
      energyLevel: session.energyLevel,
      ...stats
    });

    await detectPersonalRecords({ userId: user._id, workout });
    user.lifetimeVolume += workout.totalVolume || 0;
    user.lifetimeReps += workout.totalReps || 0;
    user.lifetimeSets += workout.totalSets || 0;
    user.lifetimeWorkoutCount += 1;

    await ActivityFeedItem.create({
      userId: user._id,
      type: "workout_completed",
      workoutId: workout._id,
      title: workout.title,
      totalVolume: workout.totalVolume,
      totalSets: workout.totalSets,
      totalReps: workout.totalReps,
      exerciseCount: workout.exercises?.length || 0,
      bestEstimated1RM: workout.bestEstimated1RM,
      createdAt: session.date
    });
  }
  await user.save();

  await WorkoutTemplate.insertMany(
    TEMPLATES.map((template) => ({
      userId: user._id,
      name: template.name,
      description: `${template.name} session from the test account program.`,
      goalPath: user.goalPath,
      exercises: template.exercises.map((exerciseName) => {
        const exercise = exerciseMap.get(exerciseName);
        return {
          exerciseId: exercise._id,
          exerciseName,
          targetSets: EXERCISES[exerciseName].sets,
          targetRepMin: exercise.defaultRepMin || 6,
          targetRepMax: exercise.defaultRepMax || 10,
          notes: ""
        };
      })
    }))
  );

  const trainedDayKeys = new Set(sessions.map((session) => session.date.toISOString().slice(0, 10)));
  await CalendarEntry.insertMany(
    calendarEntries
      .filter((entry) => !trainedDayKeys.has(entry.date.toISOString().slice(0, 10)))
      .map((entry) => ({ userId: user._id, source: "manual", ...entry })),
    { ordered: false }
  );

  // Rebuilds PRs, XP, ranks, recovery, training load, weak points, overload, deload and missions.
  await recalculateUserTrainingState({ user, clearMissions: true, clearReports: true });

  const months = new Set(sessions.map((session) => `${session.date.getUTCFullYear()}-${session.date.getUTCMonth() + 1}`));
  for (const key of months) {
    const [year, month] = key.split("-").map(Number);
    await generateMonthlyReport({ user, month, year });
  }

  let planSummary = "not generated";
  const readiness = await getTrainingReadiness(user._id);
  if (readiness.unlocked) {
    const plan = await generateNewPlan(user, 4);
    planSummary = `4-week plan (${plan.splitSummary})`;
  }

  return { user, workoutCount: sessions.length, calendarEntryCount: calendarEntries.length, planSummary };
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await connectDB();
    const startDate = process.env.SEED_START_DATE ? new Date(`${process.env.SEED_START_DATE}T00:00:00Z`) : undefined;
    const result = await seedTestAccount({
      email: process.env.SEED_EMAIL || undefined,
      password: process.env.SEED_PASSWORD || undefined,
      username: process.env.SEED_USERNAME || undefined,
      startDate
    });
    console.log("Test account ready.");
    console.log(`  Login:    ${result.user.email}`);
    console.log(`  Username: @${result.user.username}`);
    console.log(`  Workouts: ${result.workoutCount}`);
    console.log(`  Calendar rest/treatment days: ${result.calendarEntryCount}`);
    console.log(`  Upcoming plan: ${result.planSummary}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Test account seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}
