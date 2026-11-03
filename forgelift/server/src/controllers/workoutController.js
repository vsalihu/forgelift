import ActivityFeedItem from "../models/ActivityFeedItem.js";
import Exercise from "../models/Exercise.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import Workout from "../models/Workout.js";
import { calculateXP } from "../utils/calculateXP.js";
import { recalculateUserRanks } from "../utils/calculateRanks.js";
import { buildOneRepMaxLookup } from "../utils/buildOneRepMaxLookup.js";
import { calculateWorkoutStats } from "../utils/calculateWorkoutStats.js";
import { detectImplausibleLifts } from "../utils/detectImplausibleLifts.js";
import { detectPersonalRecords } from "../utils/detectPersonalRecords.js";
import { generateWorkoutAnalysis } from "../utils/generateWorkoutAnalysis.js";
import { recalculateRecoveryFromWorkouts } from "../utils/recalculateRecoveryFromWorkouts.js";
import { updateOverloadRecommendations } from "../utils/updateOverloadRecommendations.js";
import { updateDeloadRecommendations } from "../utils/updateDeloadRecommendations.js";
import { updateWeeklyMissions } from "../utils/updateWeeklyMissions.js";
import { updateWeakPoints } from "../utils/updateWeakPoints.js";

const optionalRatingFields = ["sessionRPE", "soreness", "sleepQuality", "energyLevel"];

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
};

const validateRating = (value, label, errors) => {
  const numberValue = normalizeOptionalNumber(value);

  if (numberValue === undefined) return;

  if (Number.isNaN(numberValue) || numberValue < 1 || numberValue > 10) {
    errors.push(`${label} must be between 1 and 10.`);
  }
};

const validateWorkoutPayload = (payload) => {
  const errors = [];

  optionalRatingFields.forEach((field) => {
    validateRating(payload[field], field, errors);
  });

  if (payload.date !== undefined && payload.date !== null && payload.date !== "") {
    const date = new Date(payload.date);
    // A day of slack covers time zones ahead of the server.
    if (Number.isNaN(date.getTime())) {
      errors.push("Workout date is not a valid date.");
    } else if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      errors.push("Workout date can't be in the future.");
    } else if (date.getFullYear() < 2000) {
      errors.push("Workout date is too far in the past.");
    }
  }

  if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    errors.push("Workout must include at least one exercise.");
    return errors;
  }

  payload.exercises.forEach((exercise, exerciseIndex) => {
    if (!exercise.exerciseId && !exercise.exerciseName) {
      errors.push(`Exercise ${exerciseIndex + 1} must include an exercise.`);
    }

    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      errors.push(`${exercise.exerciseName || `Exercise ${exerciseIndex + 1}`} must include at least one set.`);
      return;
    }

    exercise.sets.forEach((set, setIndex) => {
      const setLabel = `${exercise.exerciseName || `Exercise ${exerciseIndex + 1}`} set ${setIndex + 1}`;
      const isBodyweight = exercise.exerciseType === "bodyweight" || set.bodyweightOnly || set.bodyweightUsed;
      const bodyweightUsed = set.bodyweightUsed === undefined || set.bodyweightUsed === null || set.bodyweightUsed === "" ? null : Number(set.bodyweightUsed);
      const addedLoad = set.addedLoad === undefined || set.addedLoad === null || set.addedLoad === "" ? 0 : Number(set.addedLoad);
      const weight = Number(set.totalLoad || set.weight);
      const reps = Number(set.reps);
      const rpe = normalizeOptionalNumber(set.rpe);

      if (isBodyweight && (!bodyweightUsed || bodyweightUsed <= 0)) {
        errors.push(`${setLabel} needs bodyweight from your profile.`);
      }

      if (Number.isNaN(addedLoad) || addedLoad < 0) {
        errors.push(`${setLabel} added load cannot be negative.`);
      }

      if (Number.isNaN(weight) || weight <= 0) {
        errors.push(`${setLabel} needs a valid training load.`);
      }

      if (Number.isNaN(reps) || reps <= 0) {
        errors.push(`${setLabel} reps must be positive.`);
      }

      if (rpe !== undefined && (Number.isNaN(rpe) || rpe < 1 || rpe > 10)) {
        errors.push(`${setLabel} RPE must be between 1 and 10.`);
      }
    });
  });

  return errors;
};

const hydrateExercises = async (workoutExercises = []) => {
  return Promise.all(
    workoutExercises.map(async (workoutExercise) => {
      let libraryExercise = null;

      if (workoutExercise.exerciseId) {
        libraryExercise = await Exercise.findById(workoutExercise.exerciseId);
      }

      if (workoutExercise.exerciseId && !libraryExercise) {
        const error = new Error("One or more selected exercises could not be found.");
        error.statusCode = 400;
        throw error;
      }

      return {
        exerciseId: libraryExercise?._id || workoutExercise.exerciseId,
        exerciseName: libraryExercise?.name || workoutExercise.exerciseName,
        exerciseType: libraryExercise?.exerciseType || workoutExercise.exerciseType || "",
        mainMuscleGroups: libraryExercise?.mainMuscleGroups || workoutExercise.mainMuscleGroups || [],
        detailedMuscles: libraryExercise?.detailedMuscles || workoutExercise.detailedMuscles || [],
        primaryMuscles: libraryExercise?.primaryMuscles || workoutExercise.primaryMuscles || [],
        secondaryMuscles: libraryExercise?.secondaryMuscles || workoutExercise.secondaryMuscles || [],
        stabiliserMuscles: libraryExercise?.stabiliserMuscles || workoutExercise.stabiliserMuscles || [],
        impactProfile: libraryExercise?.impactProfile || workoutExercise.impactProfile || {},
        sets: workoutExercise.sets.map((set) => {
          const bodyweightOnly = Boolean(set.bodyweightOnly);
          const bodyweightUsed =
            set.bodyweightUsed === undefined || set.bodyweightUsed === null || set.bodyweightUsed === ""
              ? null
              : Number(set.bodyweightUsed);
          const addedLoad =
            set.addedLoad === undefined || set.addedLoad === null || set.addedLoad === "" ? null : Number(set.addedLoad);
          const totalLoad =
            Number(set.totalLoad) ||
            (bodyweightUsed ? bodyweightUsed + (addedLoad || 0) : Number(set.weight) || 0);

          return {
            weight: totalLoad,
            reps: Number(set.reps),
            rpe: normalizeOptionalNumber(set.rpe),
            completed: set.completed !== false,
            notes: set.notes || "",
            bodyweightOnly,
            bodyweightUsed,
            addedLoad,
            totalLoad
          };
        })
      };
    })
  );
};

const buildWorkoutData = async (payload, oneRepMaxLookup) => {
  const exercises = await hydrateExercises(payload.exercises);
  const stats = calculateWorkoutStats(exercises, oneRepMaxLookup);

  return {
    title: payload.title?.trim() || "Workout",
    date: payload.date ? new Date(payload.date) : new Date(),
    notes: payload.notes || "",
    sessionRPE: normalizeOptionalNumber(payload.sessionRPE),
    soreness: normalizeOptionalNumber(payload.soreness),
    sleepQuality: normalizeOptionalNumber(payload.sleepQuality),
    energyLevel: normalizeOptionalNumber(payload.energyLevel),
    ...stats
  };
};

// Implausible sessions are still saved; they just don't count on public leaderboards.
const getLeaderboardEligibility = async ({ user, workoutData, excludeWorkoutId }) => {
  const query = {
    userId: user._id,
    recordType: "best_estimated_1rm",
    exerciseName: { $in: workoutData.exercises.map((exercise) => exercise.exerciseName) },
    leaderboardEligible: { $ne: false }
  };
  if (excludeWorkoutId) query.workoutId = { $ne: excludeWorkoutId };

  const records = await PersonalRecord.find(query).select("exerciseName value");
  const previousBestByExercise = new Map();
  records.forEach((record) => {
    previousBestByExercise.set(record.exerciseName, Math.max(previousBestByExercise.get(record.exerciseName) || 0, record.value));
  });

  const leaderboardFlags = detectImplausibleLifts({
    exercises: workoutData.exercises,
    previousBestByExercise,
    user,
    totalVolume: workoutData.totalVolume
  });
  return { leaderboardEligible: leaderboardFlags.length === 0, leaderboardFlags };
};

const getRecentWorkouts = (userId) => {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  return Workout.find({ userId, date: { $gte: since } }).sort({ date: -1, createdAt: -1 });
};

const cleanClientRequestId = (value) => (typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value) ? value : undefined);

// The workout is the only part of a save that must succeed. Everything after it (ranks, recovery,
// recommendations, missions) is derived data that can be rebuilt later, so a failure there is logged
// and skipped instead of turning a saved workout into an error the user would retry.
const settle = async (label, task, fallback) => {
  try {
    return await task();
  } catch (error) {
    console.error(`Workout change: skipped ${label}:`, error.message);
    return fallback;
  }
};

const emptyRanks = (user) => ({ overallRank: user.currentOverallRank, overallScore: user.overallRankScore, xp: user.xp || 0, muscleRanks: [], rankPromotions: [] });

export const createWorkout = async (req, res) => {
  try {
    const errors = validateWorkoutPayload(req.body);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const clientRequestId = cleanClientRequestId(req.body.clientRequestId);
    const replay = async () => {
      const existing = await Workout.findOne({ userId: req.user._id, clientRequestId });
      if (!existing) return null;
      const personalRecords = await PersonalRecord.find({ userId: req.user._id, workoutId: existing._id });
      return res.status(200).json({
        workout: existing,
        duplicate: true,
        analysis: { ...generateWorkoutAnalysis({ workout: existing, newPersonalRecords: personalRecords }), xpEarned: 0 }
      });
    };

    // A retry of a save that already went through (a dropped connection, a second tap): hand back the first one.
    if (clientRequestId) {
      const replayed = await replay();
      if (replayed) return replayed;
    }

    const oneRepMaxLookup = await buildOneRepMaxLookup(req.user._id, req.user.strengthBaselines);
    const workoutData = await buildWorkoutData(req.body, oneRepMaxLookup);
    const eligibility = await getLeaderboardEligibility({ user: req.user, workoutData });
    let workout;
    try {
      workout = await Workout.create({
        userId: req.user._id,
        ...(clientRequestId ? { clientRequestId } : {}),
        ...workoutData,
        ...eligibility
      });
    } catch (createError) {
      // Two copies of the same save raced each other; the other one won.
      if (createError?.code === 11000 && clientRequestId) {
        const replayed = await replay();
        if (replayed) return replayed;
      }
      throw createError;
    }

    const feedItem = settle(
      "activity feed",
      () =>
        ActivityFeedItem.create({
          userId: req.user._id,
          type: "workout_completed",
          workoutId: workout._id,
          title: workout.title,
          totalVolume: workout.totalVolume,
          totalSets: workout.totalSets,
          totalReps: workout.totalReps,
          exerciseCount: workout.exercises?.length || 0,
          bestEstimated1RM: workout.bestEstimated1RM
        }),
      null
    );

    const newPersonalRecords = await settle("personal records", () => detectPersonalRecords({ userId: req.user._id, workout }), []);
    const xpEarned = calculateXP({ workout, newPersonalRecords });
    req.user.xp = (req.user.xp || 0) + xpEarned;
    req.user.lifetimeVolume = (req.user.lifetimeVolume || 0) + (workout.totalVolume || 0);
    req.user.lifetimeReps = (req.user.lifetimeReps || 0) + (workout.totalReps || 0);
    req.user.lifetimeSets = (req.user.lifetimeSets || 0) + (workout.totalSets || 0);
    req.user.lifetimeWorkoutCount = (req.user.lifetimeWorkoutCount || 0) + 1;

    // Ranks save the user (with the XP and totals above); recent workouts are an independent read.
    const [rankResult, recentWorkouts] = await Promise.all([
      settle("ranks", () => recalculateUserRanks(req.user), null),
      settle("recent workouts", () => getRecentWorkouts(req.user._id), [])
    ]);
    if (!rankResult) await settle("user totals", () => req.user.save(), null);
    let updatedRanks = rankResult || emptyRanks(req.user);

    const recoveryScores = await settle("recovery", () => recalculateRecoveryFromWorkouts({ user: req.user, recentWorkouts }), []);
    const recoverySummary = recoveryScores.filter((score) => workout.muscleLoadSummary?.[score.muscleGroup]);
    const weakPointResult = await settle("weak points", () => updateWeakPoints(req.user), { trainingBalance: null, weakPoints: [] });
    const overloadRecommendations = await settle("overload", () => updateOverloadRecommendations({ user: req.user, workout }), []);
    const deloadResult = await settle("deload", () => updateDeloadRecommendations(req.user), {});
    const missionResult = await settle("missions", () => updateWeeklyMissions({ user: req.user }), { newlyCompletedMissions: [] });
    if (missionResult.newlyCompletedMissions?.length) {
      updatedRanks = (await settle("ranks after missions", () => recalculateUserRanks(req.user), null)) || updatedRanks;
    }
    await feedItem;

    const analysis = {
      ...generateWorkoutAnalysis({ workout, newPersonalRecords }),
      xpEarned,
      rankPromotions: updatedRanks.rankPromotions,
      updatedRanks,
      recoverySummary,
      overloadRecommendations,
      plateauSummary: deloadResult.plateauSummary,
      fatigueSummary: deloadResult.fatigueSummary,
      deloadSummary: deloadResult.deloadRecommendations,
      missionSummary: missionResult.missionSummary,
      newlyCompletedMissions: missionResult.newlyCompletedMissions || [],
      weeklyTargetProgress: missionResult.weeklyTarget,
      trainingBalanceSummary: weakPointResult.trainingBalance,
      weakPointsSummary: (weakPointResult.weakPoints || []).slice(0, 5)
    };

    return res.status(201).json({ workout, analysis });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Unable to create workout." });
  }
};

export const getWorkouts = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const query = Workout.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });

    if (limit > 0) {
      query.limit(limit);
    }

    const workouts = await query;
    return res.json({ workouts });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch workouts.", error: error.message });
  }
};

export const getRecentExercises = async (req, res) => {
  try {
    const [workouts, overloadRecommendations] = await Promise.all([
      Workout.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 }).limit(20),
      OverloadRecommendation.find({ userId: req.user._id, status: "active" }).sort({ createdAt: -1 })
    ]);
    const overloadMap = overloadRecommendations.reduce((map, recommendation) => {
      if (!map[recommendation.exerciseName]) map[recommendation.exerciseName] = recommendation;
      return map;
    }, {});
    const exerciseMap = {};

    workouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        if (!exercise.exerciseName || exerciseMap[exercise.exerciseName]) return;
        const completedSets = (exercise.sets || []).filter((set) => set.completed !== false);
        const lastSet = completedSets[completedSets.length - 1] || exercise.sets?.[exercise.sets.length - 1] || {};
        exerciseMap[exercise.exerciseName] = {
          exerciseName: exercise.exerciseName,
          exerciseId: exercise.exerciseId,
          exerciseType: exercise.exerciseType || "",
          primaryMuscles: exercise.primaryMuscles || [],
          secondaryMuscles: exercise.secondaryMuscles || [],
          stabiliserMuscles: exercise.stabiliserMuscles || [],
          impactProfile: exercise.impactProfile || {},
          lastUsedAt: workout.date,
          lastWeight: lastSet.weight || 0,
          lastReps: lastSet.reps || 0,
          latestOverloadRecommendation: overloadMap[exercise.exerciseName] || null
        };
      });
    });

    return res.json({ exercises: Object.values(exerciseMap).slice(0, 12) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch recent exercises.", error: error.message });
  }
};

export const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found." });
    }

    const personalRecords = await PersonalRecord.find({ userId: req.user._id, workoutId: workout._id }).sort({
      createdAt: -1
    });
    const exerciseNames = workout.exercises.map((exercise) => exercise.exerciseName).filter(Boolean);
    const overloadRecommendations = await OverloadRecommendation.find({
      userId: req.user._id,
      exerciseName: { $in: exerciseNames },
      status: "active"
    }).sort({ createdAt: -1 });
    const deloadRecommendations = await DeloadRecommendation.find({
      userId: req.user._id,
      status: "active",
      $or: [{ exerciseName: { $in: exerciseNames } }, { muscleGroup: { $in: Object.keys(workout.muscleLoadSummary || {}) } }]
    }).sort({ createdAt: -1 });

    return res.json({ workout, personalRecords, overloadRecommendations, deloadRecommendations });
  } catch (_error) {
    return res.status(404).json({ message: "Workout not found." });
  }
};

export const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found." });
    }

    const errors = validateWorkoutPayload(req.body);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const oneRepMaxLookup = await buildOneRepMaxLookup(req.user._id, req.user.strengthBaselines);
    // Editing without a date keeps the original date instead of moving the workout to today.
    const workoutData = await buildWorkoutData({ ...req.body, date: req.body.date || workout.date }, oneRepMaxLookup);
    const eligibility = await getLeaderboardEligibility({ user: req.user, workoutData, excludeWorkoutId: workout._id });
    Object.assign(workout, workoutData, eligibility);
    await workout.save();
    await PersonalRecord.deleteMany({ userId: req.user._id, workoutId: workout._id });
    const newPersonalRecords = await detectPersonalRecords({ userId: req.user._id, workout });
    let updatedRanks = await recalculateUserRanks(req.user);
    const recentWorkouts = await getRecentWorkouts(req.user._id);
    const recoveryScores = await recalculateRecoveryFromWorkouts({ user: req.user, recentWorkouts });
    const recoverySummary = recoveryScores.filter((score) => workout.muscleLoadSummary?.[score.muscleGroup]);
    const weakPointResult = await updateWeakPoints(req.user);
    const overloadRecommendations = await updateOverloadRecommendations({ user: req.user, workout });
    const deloadResult = await updateDeloadRecommendations(req.user);
    const missionResult = await updateWeeklyMissions({ user: req.user });
    if (missionResult.newlyCompletedMissions.length) {
      updatedRanks = await recalculateUserRanks(req.user);
    }
    const analysis = {
      ...generateWorkoutAnalysis({ workout, newPersonalRecords }),
      xpEarned: 0,
      rankPromotions: updatedRanks.rankPromotions,
      updatedRanks,
      recoverySummary,
      overloadRecommendations,
      plateauSummary: deloadResult.plateauSummary,
      fatigueSummary: deloadResult.fatigueSummary,
      deloadSummary: deloadResult.deloadRecommendations,
      missionSummary: missionResult.missionSummary,
      newlyCompletedMissions: missionResult.newlyCompletedMissions,
      weeklyTargetProgress: missionResult.weeklyTarget,
      trainingBalanceSummary: weakPointResult.trainingBalance,
      weakPointsSummary: weakPointResult.weakPoints.slice(0, 5)
    };

    return res.json({ workout, analysis });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Unable to update workout." });
  }
};

export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: "Workout not found." });
    }

    // The workout is gone; from here on everything is derived data. As with saving, a failed step is
    // logged and skipped so the user never sees an error for a delete that already happened.
    await Promise.all([
      settle("personal records", () => PersonalRecord.deleteMany({ userId: req.user._id, workoutId: workout._id }), null),
      settle("activity feed", () => ActivityFeedItem.deleteMany({ userId: req.user._id, workoutId: workout._id }), null),
      settle(
        "expire overload",
        () => OverloadRecommendation.updateMany({ userId: req.user._id, workoutId: workout._id, status: "active" }, { $set: { status: "expired" } }),
        null
      )
    ]);
    req.user.lifetimeVolume = Math.max(0, (req.user.lifetimeVolume || 0) - (workout.totalVolume || 0));
    req.user.lifetimeReps = Math.max(0, (req.user.lifetimeReps || 0) - (workout.totalReps || 0));
    req.user.lifetimeSets = Math.max(0, (req.user.lifetimeSets || 0) - (workout.totalSets || 0));
    req.user.lifetimeWorkoutCount = Math.max(0, (req.user.lifetimeWorkoutCount || 0) - 1);

    const [rankResult, recentWorkouts] = await Promise.all([
      settle("ranks", () => recalculateUserRanks(req.user), null),
      settle("recent workouts", () => getRecentWorkouts(req.user._id), [])
    ]);
    if (!rankResult) await settle("user totals", () => req.user.save(), null);
    await settle("recovery", () => recalculateRecoveryFromWorkouts({ user: req.user, recentWorkouts }), null);
    await settle("weak points", () => updateWeakPoints(req.user), null);
    await settle("overload", () => updateOverloadRecommendations({ user: req.user }), null);
    await settle("deload", () => updateDeloadRecommendations(req.user), null);
    await settle("missions", () => updateWeeklyMissions({ user: req.user }), null);

    return res.json({ message: "Workout deleted." });
  } catch (error) {
    console.error("Failed to delete workout:", error.message);
    return res.status(500).json({ message: "Unable to delete workout.", error: error.message });
  }
};
