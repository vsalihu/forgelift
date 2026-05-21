import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import Assessment from "../models/Assessment.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Mission from "../models/Mission.js";
import MonthlyReport from "../models/MonthlyReport.js";
import MuscleRank from "../models/MuscleRank.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import RecoveryScore from "../models/RecoveryScore.js";
import Streak from "../models/Streak.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { recalculateUserTrainingState } from "../utils/recalculateUserTrainingState.js";

const dateRangeQuery = (field, startDate, endDate) => ({ [field]: { $gte: startDate, $lte: endDate } });

const parseDateRange = ({ startDate, endDate }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!startDate || !endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error("Please provide a valid start and end date.");
    error.statusCode = 400;
    throw error;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (start > end) {
    const error = new Error("Start date must be before end date.");
    error.statusCode = 400;
    throw error;
  }

  return { start, end };
};

const getOverlappingMonths = (start, end) => {
  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const final = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= final) {
    months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

export const getDataSummary = async (req, res) => {
  const userId = req.user._id;
  const [
    workouts,
    personalRecords,
    templates,
    assessments,
    missions,
    reports,
    overloadRecommendations,
    deloadRecommendations,
    recoveryScores,
    weakPoints
  ] = await Promise.all([
    Workout.countDocuments({ userId }),
    PersonalRecord.countDocuments({ userId }),
    WorkoutTemplate.countDocuments({ userId }),
    Assessment.countDocuments({ userId }),
    Mission.countDocuments({ userId }),
    MonthlyReport.countDocuments({ userId }),
    OverloadRecommendation.countDocuments({ userId }),
    DeloadRecommendation.countDocuments({ userId }),
    RecoveryScore.countDocuments({ userId }),
    WeakPoint.countDocuments({ userId })
  ]);
  const [firstWorkout, latestWorkout] = await Promise.all([
    Workout.findOne({ userId }).sort({ date: 1 }),
    Workout.findOne({ userId }).sort({ date: -1 })
  ]);

  return res.json({
    summary: {
      workouts,
      personalRecords,
      strengthBaselines: req.user.strengthBaselines?.length || 0,
      templates,
      assessments,
      missions,
      reports,
      overloadRecommendations,
      deloadRecommendations,
      recoveryScores,
      weakPoints,
      firstWorkoutDate: firstWorkout?.date || null,
      latestWorkoutDate: latestWorkout?.date || null
    }
  });
};

export const resetStrengthBaselines = async (req, res) => {
  if (req.body?.confirm !== true) {
    return res.status(400).json({ message: "Confirmation is required to reset strength baselines." });
  }

  req.user.strengthBaselines = [];
  req.user.strengthBaselineUpdatedAt = null;
  await req.user.save();

  return res.json({ message: "Strength baselines reset successfully.", baselines: [] });
};

export const deleteDataRange = async (req, res) => {
  try {
    if (req.body?.confirmText !== "DELETE") {
      return res.status(400).json({ message: "Type DELETE to confirm date range deletion." });
    }

    const { start, end } = parseDateRange(req.body);
    const options = {
      deleteWorkouts: true,
      deletePRsInRange: true,
      deleteMissionsInRange: false,
      deleteReportsInRange: false,
      ...(req.body.options || {})
    };
    const userId = req.user._id;
    const deletedWorkouts = options.deleteWorkouts
      ? await Workout.deleteMany({ userId, ...dateRangeQuery("date", start, end) })
      : { deletedCount: 0 };

    if (options.deletePRsInRange) {
      await PersonalRecord.deleteMany({ userId, ...dateRangeQuery("achievedAt", start, end) });
    }

    if (options.deleteMissionsInRange) {
      await Promise.all([
        Mission.deleteMany({
          userId,
          $or: [
            dateRangeQuery("createdAt", start, end),
            dateRangeQuery("completedAt", start, end),
            { startDate: { $lte: end }, endDate: { $gte: start } }
          ]
        }),
        WeeklyTarget.deleteMany({ userId, weekStart: { $lte: end }, weekEnd: { $gte: start } }),
        Streak.deleteMany({ userId })
      ]);
    }

    if (options.deleteReportsInRange) {
      const months = getOverlappingMonths(start, end);
      await Promise.all([
        AnalyticsSnapshot.deleteMany({ userId, periodStart: { $lte: end }, periodEnd: { $gte: start } }),
        MonthlyReport.deleteMany({ userId, $or: months })
      ]);
    }

    const recalculation = await recalculateUserTrainingState({
      user: req.user,
      clearMissions: Boolean(options.deleteMissionsInRange),
      clearReports: Boolean(options.deleteReportsInRange)
    });

    return res.json({
      message:
        deletedWorkouts.deletedCount > 0
          ? "Selected period deleted and training state recalculated."
          : "No workouts found in that date range. Derived data was refreshed.",
      deleted: {
        workouts: deletedWorkouts.deletedCount
      },
      recalculation
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to delete selected period." });
  }
};

export const resetTrainingData = async (req, res) => {
  try {
    if (req.body?.confirmText !== "RESET") {
      return res.status(400).json({ message: "Type RESET to confirm full training reset." });
    }

    const userId = req.user._id;
    const deleteStrengthBaselines = Boolean(req.body.deleteStrengthBaselines);
    const deleteWorkoutTemplates = Boolean(req.body.deleteWorkoutTemplates);
    const deleteAssessmentHistory = Boolean(req.body.deleteAssessmentHistory);

    await Promise.all([
      Workout.deleteMany({ userId }),
      PersonalRecord.deleteMany({ userId }),
      MuscleRank.deleteMany({ userId }),
      RecoveryScore.deleteMany({ userId }),
      WeakPoint.deleteMany({ userId }),
      TrainingBalance.deleteMany({ userId }),
      OverloadRecommendation.deleteMany({ userId }),
      DeloadRecommendation.deleteMany({ userId }),
      Mission.deleteMany({ userId }),
      WeeklyTarget.deleteMany({ userId }),
      Streak.deleteMany({ userId }),
      AnalyticsSnapshot.deleteMany({ userId }),
      MonthlyReport.deleteMany({ userId }),
      deleteWorkoutTemplates ? WorkoutTemplate.deleteMany({ userId }) : Promise.resolve(),
      deleteAssessmentHistory ? Assessment.deleteMany({ userId }) : Promise.resolve()
    ]);

    req.user.xp = 0;
    req.user.overallRankScore = 0;
    req.user.currentOverallRank = "Copper";
    req.user.lastRankCheck = null;

    if (deleteStrengthBaselines) {
      req.user.strengthBaselines = [];
      req.user.strengthBaselineUpdatedAt = null;
    }

    if (deleteAssessmentHistory) {
      req.user.assessmentCompleted = false;
      req.user.assessmentCompletedAt = null;
      req.user.assessmentSkippedAt = null;
      req.user.assessmentSummary = {};
    }

    await req.user.save();

    return res.json({
      message: "Training data reset successfully.",
      user: req.user.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to reset training data.", error: error.message });
  }
};
