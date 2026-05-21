import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Mission from "../models/Mission.js";
import MonthlyReport from "../models/MonthlyReport.js";
import MuscleRank from "../models/MuscleRank.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import RecoveryScore from "../models/RecoveryScore.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import Workout from "../models/Workout.js";
import { calculateAdvancedAnalytics } from "./calculateAdvancedAnalytics.js";
import { getMonthRange } from "./analyticsPeriod.js";

const monthName = (month, year) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));

export const generateMonthlyReport = async ({ user, month, year }) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);
  const { periodStart, periodEnd } = getMonthRange(numericMonth, numericYear);
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
    Mission.find({ userId: user._id, createdAt: { $gte: periodStart, $lte: periodEnd } }),
    OverloadRecommendation.find({ userId: user._id, createdAt: { $gte: periodStart, $lte: periodEnd } }),
    DeloadRecommendation.find({ userId: user._id, createdAt: { $gte: periodStart, $lte: periodEnd } })
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
  const bestExerciseImprovement = analytics.strengthTrends[0] || {};
  const strongestArea = analytics.rankInsights.bestMuscleRank?.muscleGroup || analytics.muscleLoadDistribution[0]?.muscle || "";
  const weakestArea = analytics.rankInsights.lowestMuscleRank?.muscleGroup || weakPoints[0]?.muscleGroup || "";
  const summary = workouts.length
    ? `${monthName(numericMonth, numericYear)} included ${analytics.overview.totalWorkouts} workouts, ${analytics.overview.totalPRs} personal records, and ${analytics.overview.missionsCompleted} completed missions. ${analytics.balanceInsights.mainWarning || "Training balance has no major warning right now."}`
    : `${monthName(numericMonth, numericYear)} has no logged workouts yet. Log sessions to build a meaningful monthly report.`;

  const reportData = {
    userId: user._id,
    month: numericMonth,
    year: numericYear,
    periodStart,
    periodEnd,
    title: `${monthName(numericMonth, numericYear)} ForgeLift Report`,
    summary,
    totalWorkouts: analytics.overview.totalWorkouts,
    totalVolume: analytics.overview.totalVolume,
    totalPRs: analytics.overview.totalPRs,
    missionsCompleted: analytics.overview.missionsCompleted,
    rankSummary: analytics.rankInsights,
    bestExerciseImprovement,
    bestMuscleProgress: analytics.rankInsights.bestMuscleRank || {},
    weakestArea,
    strongestArea,
    recoverySummary: analytics.recoveryTrends,
    balanceSummary: analytics.balanceInsights,
    overloadSummary: analytics.overloadInsights,
    deloadSummary: analytics.deloadInsights,
    missionSummary: analytics.missionInsights,
    insights: [
      summary,
      ...(analytics.prInsights.latestPR ? [`Latest PR: ${analytics.prInsights.latestPR.exerciseName} ${analytics.prInsights.latestPR.recordType.replaceAll("_", " ")}.`] : []),
      ...(analytics.recommendations || [])
    ].slice(0, 8),
    nextMonthFocus: analytics.recommendations.slice(0, 5)
  };

  return MonthlyReport.findOneAndUpdate(
    { userId: user._id, month: numericMonth, year: numericYear },
    { $set: reportData },
    { new: true, upsert: true }
  );
};
