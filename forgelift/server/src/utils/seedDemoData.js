import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
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
import User from "../models/User.js";
import WeakPoint from "../models/WeakPoint.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { connectDB } from "../config/db.js";
import { calculateAdvancedAnalytics } from "./calculateAdvancedAnalytics.js";
import { calculateWorkoutStats } from "./calculateWorkoutStats.js";
import { detectPersonalRecords } from "./detectPersonalRecords.js";
import { generateMonthlyReport } from "./generateMonthlyReport.js";
import { getMonthRange } from "./analyticsPeriod.js";
import { recalculateRecoveryFromWorkouts } from "./recalculateRecoveryFromWorkouts.js";
import { recalculateUserRanks } from "./calculateRanks.js";
import { seedExercises } from "./seedExercises.js";
import { updateDeloadRecommendations } from "./updateDeloadRecommendations.js";
import { updateOverloadRecommendations } from "./updateOverloadRecommendations.js";
import { updateWeakPoints } from "./updateWeakPoints.js";
import { updateWeeklyMissions } from "./updateWeeklyMissions.js";

dotenv.config();

const DEMO_EMAIL = "demo@forgelift.app";
const DEMO_PASSWORD = "Demo123!";

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(18, 0, 0, 0);
  return date;
};

const clearDemoData = async (userId) => {
  await Promise.all([
    AnalyticsSnapshot.deleteMany({ userId }),
    DeloadRecommendation.deleteMany({ userId }),
    Mission.deleteMany({ userId }),
    MonthlyReport.deleteMany({ userId }),
    MuscleRank.deleteMany({ userId }),
    OverloadRecommendation.deleteMany({ userId }),
    PersonalRecord.deleteMany({ userId }),
    RecoveryScore.deleteMany({ userId }),
    Streak.deleteMany({ userId }),
    TrainingBalance.deleteMany({ userId }),
    WeakPoint.deleteMany({ userId }),
    WeeklyTarget.deleteMany({ userId }),
    Workout.deleteMany({ userId }),
    WorkoutTemplate.deleteMany({ userId })
  ]);
};

const getOrCreateDemoUser = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      $set: {
        name: "Demo Athlete",
        email: DEMO_EMAIL,
        passwordHash,
        gender: "male",
        selectedStrengthStandard: "male",
        customGenderLabel: "",
        age: 25,
        height: 178,
        bodyweight: 82,
        preferredUnits: "metric",
        trainingExperience: "Intermediate",
        goalPath: "Strength Warrior",
        bodyMeasurements: {
          chest: 104,
          waist: 82,
          shoulders: 122,
          arms: 37,
          thighs: 61,
          calves: 39
        },
        onboardingCompleted: true,
        overloadMode: "Balanced",
        xp: 0,
        overallRankScore: 0,
        currentOverallRank: "Copper",
        strengthBaselines: [],
        strengthBaselineUpdatedAt: null,
        beginnerTipsEnabled: true
      }
    },
    { new: true, upsert: true }
  );

  await clearDemoData(user._id);
  return user;
};

const exercisePayload = (exerciseMap, name, sets) => {
  const exercise = exerciseMap.get(name);

  if (!exercise) {
    throw new Error(`Missing seeded exercise: ${name}`);
  }

  return {
    exerciseId: exercise._id,
    exerciseName: exercise.name,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    stabiliserMuscles: exercise.stabiliserMuscles,
    impactProfile: exercise.impactProfile,
    sets: sets.map((set) => ({
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      completed: set.completed !== false,
      notes: set.notes || ""
    }))
  };
};

const createWorkout = async ({ user, exerciseMap, title, date, notes, sessionRPE, soreness, sleepQuality, energyLevel, exercises }) => {
  const hydratedExercises = exercises.map((exercise) => exercisePayload(exerciseMap, exercise.name, exercise.sets));
  const stats = calculateWorkoutStats(hydratedExercises);
  const workout = await Workout.create({
    userId: user._id,
    title,
    date,
    notes,
    sessionRPE,
    soreness,
    sleepQuality,
    energyLevel,
    ...stats
  });

  const newPersonalRecords = await detectPersonalRecords({ userId: user._id, workout });
  user.xp = (user.xp || 0) + 50 + workout.completedSetCount * 5 + newPersonalRecords.length * 100;
  await user.save();

  return workout;
};

const seedWorkouts = async ({ user, exerciseMap }) => {
  const workouts = [
    {
      title: "Demo Strength Push Baseline",
      date: daysAgo(41),
      notes: "Chest-heavy baseline session for demo analytics.",
      sessionRPE: 8,
      soreness: 4,
      sleepQuality: 8,
      energyLevel: 8,
      exercises: [
        { name: "Bench Press", sets: [{ weight: 80, reps: 10, rpe: 8 }, { weight: 80, reps: 10, rpe: 8 }, { weight: 80, reps: 9, rpe: 8.5 }] },
        { name: "Incline Dumbbell Press", sets: [{ weight: 28, reps: 10, rpe: 8 }, { weight: 28, reps: 9, rpe: 8 }] },
        { name: "Tricep Pushdown", sets: [{ weight: 32, reps: 12, rpe: 8 }, { weight: 32, reps: 11, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Pull Volume",
      date: daysAgo(37),
      notes: "Pull work to give the demo account balanced history.",
      sessionRPE: 7,
      soreness: 3,
      sleepQuality: 7,
      energyLevel: 8,
      exercises: [
        { name: "Barbell Row", sets: [{ weight: 70, reps: 10, rpe: 7.5 }, { weight: 70, reps: 10, rpe: 8 }, { weight: 70, reps: 9, rpe: 8 }] },
        { name: "Lat Pulldown", sets: [{ weight: 62, reps: 12, rpe: 8 }, { weight: 62, reps: 11, rpe: 8 }] },
        { name: "Bicep Curl", sets: [{ weight: 16, reps: 12, rpe: 8 }, { weight: 16, reps: 12, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Lower Strength",
      date: daysAgo(33),
      notes: "Squat and hinge day.",
      sessionRPE: 8,
      soreness: 5,
      sleepQuality: 7,
      energyLevel: 7,
      exercises: [
        { name: "Squat", sets: [{ weight: 105, reps: 8, rpe: 8 }, { weight: 105, reps: 8, rpe: 8.5 }, { weight: 105, reps: 7, rpe: 8.5 }] },
        { name: "Romanian Deadlift", sets: [{ weight: 95, reps: 10, rpe: 8 }, { weight: 95, reps: 9, rpe: 8 }] },
        { name: "Plank", sets: [{ weight: 0, reps: 2, rpe: 7 }, { weight: 0, reps: 2, rpe: 7 }] }
      ]
    },
    {
      title: "Demo Push Plateau Start",
      date: daysAgo(27),
      notes: "Bench moved up, but effort also rose.",
      sessionRPE: 9,
      soreness: 6,
      sleepQuality: 6,
      energyLevel: 6,
      exercises: [
        { name: "Bench Press", sets: [{ weight: 85, reps: 8, rpe: 9 }, { weight: 85, reps: 8, rpe: 9 }, { weight: 85, reps: 7, rpe: 9.5 }] },
        { name: "Overhead Press", sets: [{ weight: 45, reps: 7, rpe: 8.5 }, { weight: 45, reps: 6, rpe: 9 }] },
        { name: "Lateral Raise", sets: [{ weight: 10, reps: 14, rpe: 8 }, { weight: 10, reps: 13, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Glute Lower",
      date: daysAgo(23),
      notes: "Glute and hamstring-focused lower session.",
      sessionRPE: 8,
      soreness: 5,
      sleepQuality: 8,
      energyLevel: 7,
      exercises: [
        { name: "Hip Thrust", sets: [{ weight: 125, reps: 10, rpe: 8 }, { weight: 125, reps: 10, rpe: 8 }, { weight: 125, reps: 9, rpe: 8.5 }] },
        { name: "Romanian Deadlift", sets: [{ weight: 100, reps: 9, rpe: 8 }, { weight: 100, reps: 8, rpe: 8.5 }] },
        { name: "Leg Press", sets: [{ weight: 180, reps: 12, rpe: 8 }, { weight: 180, reps: 12, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Pull Recovery",
      date: daysAgo(18),
      notes: "Another pull session to seed PR and balance data.",
      sessionRPE: 8,
      soreness: 4,
      sleepQuality: 7,
      energyLevel: 7,
      exercises: [
        { name: "Pull-up", sets: [{ weight: 0, reps: 9, rpe: 8 }, { weight: 0, reps: 8, rpe: 8 }, { weight: 0, reps: 7, rpe: 8.5 }] },
        { name: "Barbell Row", sets: [{ weight: 75, reps: 9, rpe: 8 }, { weight: 75, reps: 8, rpe: 8.5 }, { weight: 75, reps: 8, rpe: 8.5 }] },
        { name: "Bicep Curl", sets: [{ weight: 18, reps: 10, rpe: 8 }, { weight: 18, reps: 10, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Bench Plateau",
      date: daysAgo(13),
      notes: "Stalled bench pattern for deload demo.",
      sessionRPE: 9,
      soreness: 7,
      sleepQuality: 5,
      energyLevel: 5,
      exercises: [
        { name: "Bench Press", sets: [{ weight: 85, reps: 8, rpe: 9 }, { weight: 85, reps: 7, rpe: 9.5 }, { weight: 85, reps: 6, rpe: 9.5 }] },
        { name: "Incline Dumbbell Press", sets: [{ weight: 30, reps: 8, rpe: 9 }, { weight: 30, reps: 8, rpe: 9 }] },
        { name: "Tricep Pushdown", sets: [{ weight: 34, reps: 10, rpe: 9 }, { weight: 34, reps: 9, rpe: 9 }] }
      ]
    },
    {
      title: "Demo Squat PR",
      date: daysAgo(9),
      notes: "Lower day with a small squat improvement.",
      sessionRPE: 8,
      soreness: 5,
      sleepQuality: 7,
      energyLevel: 7,
      exercises: [
        { name: "Squat", sets: [{ weight: 112.5, reps: 7, rpe: 8.5 }, { weight: 112.5, reps: 7, rpe: 8.5 }, { weight: 112.5, reps: 6, rpe: 9 }] },
        { name: "Deadlift", sets: [{ weight: 135, reps: 5, rpe: 8.5 }, { weight: 135, reps: 5, rpe: 9 }] },
        { name: "Plank", sets: [{ weight: 0, reps: 3, rpe: 8 }, { weight: 0, reps: 2, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Pull Support",
      date: daysAgo(6),
      notes: "Pull volume is present but lower than pressing volume.",
      sessionRPE: 7,
      soreness: 3,
      sleepQuality: 8,
      energyLevel: 8,
      exercises: [
        { name: "Lat Pulldown", sets: [{ weight: 67, reps: 10, rpe: 8 }, { weight: 67, reps: 10, rpe: 8 }, { weight: 67, reps: 9, rpe: 8 }] },
        { name: "Barbell Row", sets: [{ weight: 75, reps: 10, rpe: 8 }, { weight: 75, reps: 9, rpe: 8 }] },
        { name: "Bicep Curl", sets: [{ weight: 18, reps: 11, rpe: 8 }, { weight: 18, reps: 10, rpe: 8 }] }
      ]
    },
    {
      title: "Demo Heavy Push Warning",
      date: daysAgo(2),
      notes: "Recent high-effort pressing should light up recovery and deload warnings.",
      sessionRPE: 9,
      soreness: 8,
      sleepQuality: 5,
      energyLevel: 5,
      exercises: [
        { name: "Bench Press", sets: [{ weight: 85, reps: 7, rpe: 9.5 }, { weight: 85, reps: 6, rpe: 9.5 }, { weight: 85, reps: 5, rpe: 10, completed: false }] },
        { name: "Overhead Press", sets: [{ weight: 45, reps: 6, rpe: 9 }, { weight: 45, reps: 5, rpe: 9.5 }] },
        { name: "Lateral Raise", sets: [{ weight: 10, reps: 12, rpe: 8.5 }, { weight: 10, reps: 12, rpe: 8.5 }] }
      ]
    }
  ];

  const createdWorkouts = [];

  for (const workout of workouts.sort((a, b) => a.date - b.date)) {
    createdWorkouts.push(await createWorkout({ user, exerciseMap, ...workout }));
  }

  return createdWorkouts;
};

const seedTemplates = async ({ user, exerciseMap }) => {
  const templates = [
    {
      name: "Strength Push",
      description: "Bench-led upper body strength session.",
      exercises: ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdown"]
    },
    {
      name: "Strength Pull",
      description: "Rows, pulldowns, and arms for pull balance.",
      exercises: ["Barbell Row", "Lat Pulldown", "Pull-up", "Bicep Curl"]
    },
    {
      name: "Strength Legs",
      description: "Squat, hinge, and core session.",
      exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Plank"]
    }
  ];

  await WorkoutTemplate.insertMany(
    templates.map((template) => ({
      userId: user._id,
      name: template.name,
      description: template.description,
      goalPath: user.goalPath,
      exercises: template.exercises.map((name) => {
        const exercise = exerciseMap.get(name);
        return {
          exerciseId: exercise?._id,
          exerciseName: name,
          targetSets: 3,
          targetRepMin: exercise?.defaultRepMin || 6,
          targetRepMax: exercise?.defaultRepMax || 10,
          notes: ""
        };
      })
    }))
  );
};

const createAnalyticsSnapshot = async ({ user }) => {
  const now = new Date();
  const { periodStart, periodEnd } = getMonthRange(now.getMonth() + 1, now.getFullYear());
  const [
    workouts,
    personalRecords,
    muscleRanks,
    recoveryScores,
    trainingBalance,
    weakPoints,
    missions,
    overloadRecommendations,
    deloadRecommendations
  ] = await Promise.all([
    Workout.find({ userId: user._id, date: { $gte: periodStart, $lte: periodEnd } }),
    PersonalRecord.find({ userId: user._id, achievedAt: { $gte: periodStart, $lte: periodEnd } }),
    MuscleRank.find({ userId: user._id }),
    RecoveryScore.find({ userId: user._id }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 }),
    WeakPoint.find({ userId: user._id, active: true }),
    Mission.find({ userId: user._id }),
    OverloadRecommendation.find({ userId: user._id }),
    DeloadRecommendation.find({ userId: user._id })
  ]);
  const analytics = calculateAdvancedAnalytics({
    user,
    workouts,
    personalRecords,
    muscleRanks,
    recoveryScores,
    trainingBalance,
    weakPoints,
    missions,
    overloadRecommendations,
    deloadRecommendations,
    periodStart,
    periodEnd
  });

  await AnalyticsSnapshot.findOneAndUpdate(
    { userId: user._id, periodType: "monthly", periodStart, periodEnd },
    {
      $set: {
        userId: user._id,
        periodType: "monthly",
        periodStart,
        periodEnd,
        totalWorkouts: analytics.overview.totalWorkouts,
        totalVolume: analytics.overview.totalVolume,
        totalSets: analytics.overview.totalSets,
        totalReps: analytics.overview.totalReps,
        averageSessionRPE: analytics.overview.averageSessionRPE,
        totalPRs: analytics.overview.totalPRs,
        totalMissionsCompleted: analytics.overview.missionsCompleted,
        averageRecoveryScore: analytics.recoveryTrends.averageRecoveryScore,
        averageTrainingBalanceScore: analytics.balanceInsights.score,
        topExercises: analytics.volumeTrends.byExercise.slice(0, 5),
        topMusclesByLoad: analytics.muscleLoadDistribution.slice(0, 5),
        strengthHighlights: analytics.strengthTrends.slice(0, 5),
        rankChanges: analytics.rankInsights.closestToNextRank,
        weakPointChanges: weakPoints.slice(0, 5),
        recommendations: analytics.recommendations
      }
    },
    { upsert: true, new: true }
  );
};

export const seedDemoData = async () => {
  await seedExercises();
  const user = await getOrCreateDemoUser();
  const exercises = await Exercise.find({});
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  const workouts = await seedWorkouts({ user, exerciseMap });
  await seedTemplates({ user, exerciseMap });

  const latestWorkout = workouts[workouts.length - 1];
  const recentWorkouts = await Workout.find({
    userId: user._id,
    date: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
  }).sort({ date: -1, createdAt: -1 });

  await recalculateUserRanks(user);
  await recalculateRecoveryFromWorkouts({ user, recentWorkouts });
  await updateWeakPoints(user);
  await updateOverloadRecommendations({ user, workout: latestWorkout });
  await updateDeloadRecommendations(user);
  await updateWeeklyMissions({ user, forceRegenerate: true });
  await createAnalyticsSnapshot({ user });

  const now = new Date();
  await generateMonthlyReport({ user, month: now.getMonth() + 1, year: now.getFullYear() });

  return {
    user,
    workoutCount: workouts.length,
    templateCount: 3
  };
};

const run = async () => {
  try {
    await connectDB();
    const result = await seedDemoData();
    console.log("Demo data seeded successfully.");
    console.log(`Demo user: ${DEMO_EMAIL}`);
    console.log(`Demo password: ${DEMO_PASSWORD}`);
    console.log(`Workouts seeded: ${result.workoutCount}`);
    console.log(`Templates seeded: ${result.templateCount}`);
  } catch (error) {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv[1]?.replace(/\\/g, "/").endsWith("/seedDemoData.js")) {
  run();
}
