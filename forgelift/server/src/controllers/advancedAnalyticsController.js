import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import BodyweightEntry from "../models/BodyweightEntry.js";
import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Mission from "../models/Mission.js";
import MuscleRank from "../models/MuscleRank.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import RecoveryScore from "../models/RecoveryScore.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { calculateAdvancedAnalytics } from "../utils/calculateAdvancedAnalytics.js";
import { getAnalyticsPeriod } from "../utils/analyticsPeriod.js";
import { calculateProgressAnalytics } from "../utils/calculateProgressAnalytics.js";

const loadAnalytics = async (user, period = "month") => {
  const { periodStart, periodEnd, periodType } = getAnalyticsPeriod(period);
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
    Workout.find({ userId: user._id, date: { $gte: periodStart, $lte: periodEnd } }).sort({ date: 1 }),
    PersonalRecord.find({ userId: user._id, achievedAt: { $gte: periodStart, $lte: periodEnd } }),
    MuscleRank.find({ userId: user._id }),
    RecoveryScore.find({ userId: user._id }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 }),
    WeakPoint.find({ userId: user._id, active: true }),
    Mission.find({ userId: user._id }),
    OverloadRecommendation.find({ userId: user._id }),
    DeloadRecommendation.find({ userId: user._id })
  ]);

  return {
    periodStart,
    periodEnd,
    periodType,
    analytics: calculateAdvancedAnalytics({
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
    })
  };
};

export const getAnalyticsOverview = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period);
    return res.json({ periodStart: result.periodStart, periodEnd: result.periodEnd, overview: result.analytics.overview });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch analytics overview.", error: error.message });
  }
};

export const getVolumeTrends = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period);
    return res.json({ volumeTrends: result.analytics.volumeTrends });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch volume trends.", error: error.message });
  }
};

export const getStrengthTrends = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period);
    return res.json({ strengthTrends: result.analytics.strengthTrends });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch strength trends.", error: error.message });
  }
};

export const getMuscleLoadDistribution = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period);
    return res.json({ muscleLoadDistribution: result.analytics.muscleLoadDistribution });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch muscle load distribution.", error: error.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period);
    return res.json({
      prInsights: result.analytics.prInsights,
      recoveryTrends: result.analytics.recoveryTrends,
      missionInsights: result.analytics.missionInsights,
      rankInsights: result.analytics.rankInsights,
      balanceInsights: result.analytics.balanceInsights,
      recommendations: result.analytics.recommendations
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch insights.", error: error.message });
  }
};

export const createSnapshot = async (req, res) => {
  try {
    const result = await loadAnalytics(req.user, req.query.period || req.body.period);
    const { overview, volumeTrends, muscleLoadDistribution, strengthTrends, rankInsights, recommendations } = result.analytics;
    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      {
        userId: req.user._id,
        periodType: result.periodType,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd
      },
      {
        $set: {
          userId: req.user._id,
          periodType: result.periodType,
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          totalWorkouts: overview.totalWorkouts,
          totalVolume: overview.totalVolume,
          totalSets: overview.totalSets,
          totalReps: overview.totalReps,
          averageSessionRPE: overview.averageSessionRPE,
          totalPRs: overview.totalPRs,
          totalMissionsCompleted: overview.missionsCompleted,
          averageRecoveryScore: result.analytics.recoveryTrends.averageRecoveryScore,
          averageTrainingBalanceScore: result.analytics.balanceInsights.score,
          topExercises: volumeTrends.byExercise,
          topMusclesByLoad: muscleLoadDistribution.slice(0, 8),
          strengthHighlights: strengthTrends.slice(0, 5),
          rankChanges: rankInsights.closestToNextRank || [],
          weakPointChanges: [],
          recommendations
        }
      },
      { new: true, upsert: true }
    );

    return res.json({ snapshot });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create analytics snapshot.", error: error.message });
  }
};

const PROGRESS_PERIODS = ["month", "90d", "180d", "365d", "all"];
const MAX_GOALS = 12;

const buildProgress = async (user, period) => {
  const [workouts, personalRecords, bodyweightEntries] = await Promise.all([
    Workout.find({ userId: user._id }).sort({ date: 1, createdAt: 1 }),
    PersonalRecord.find({ userId: user._id }),
    BodyweightEntry.find({ userId: user._id }).sort({ recordedAt: 1 })
  ]);

  return calculateProgressAnalytics({ user, workouts, personalRecords, bodyweightEntries, period });
};

export const getProgressAnalytics = async (req, res) => {
  try {
    const period = PROGRESS_PERIODS.includes(req.query.period) ? req.query.period : "180d";
    return res.json({ progress: await buildProgress(req.user, period) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to build progress analytics.", error: error.message });
  }
};

export const setStrengthGoal = async (req, res) => {
  try {
    const exerciseName = String(req.body.exerciseName || "").trim();
    const target = Number(req.body.target);

    if (!exerciseName || exerciseName.length > 100) {
      return res.status(400).json({ message: "Choose a lift for this goal." });
    }

    if (!Number.isFinite(target) || target <= 0 || target > 2000) {
      return res.status(400).json({ message: "Enter a goal weight between 1 and 2000." });
    }

    const goals = (req.user.strengthGoals || []).filter((goal) => goal.exerciseName !== exerciseName);
    if (goals.length >= MAX_GOALS) {
      return res.status(400).json({ message: `You can track up to ${MAX_GOALS} goals at once.` });
    }

    req.user.strengthGoals = [...goals, { exerciseName, target }];
    await req.user.save();
    return res.json({ strengthGoals: req.user.strengthGoals });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save goal.", error: error.message });
  }
};

export const deleteStrengthGoal = async (req, res) => {
  try {
    const exerciseName = decodeURIComponent(req.params.exerciseName || "");
    req.user.strengthGoals = (req.user.strengthGoals || []).filter((goal) => goal.exerciseName !== exerciseName);
    await req.user.save();
    return res.json({ strengthGoals: req.user.strengthGoals });
  } catch (error) {
    return res.status(500).json({ message: "Unable to remove goal.", error: error.message });
  }
};
