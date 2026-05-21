import DeloadRecommendation from "../models/DeloadRecommendation.js";
import Mission from "../models/Mission.js";
import MuscleRank from "../models/MuscleRank.js";
import OverloadRecommendation from "../models/OverloadRecommendation.js";
import PersonalRecord from "../models/PersonalRecord.js";
import RecoveryScore from "../models/RecoveryScore.js";
import Streak from "../models/Streak.js";
import TrainingBalance from "../models/TrainingBalance.js";
import WeakPoint from "../models/WeakPoint.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import Workout from "../models/Workout.js";
import { generateWeeklyMissions } from "./generateWeeklyMissions.js";
import { generateWeeklyTargets } from "./generateWeeklyTargets.js";
import { updateMissionProgress } from "./updateMissionProgress.js";
import { getCurrentWeekRange } from "./weekUtils.js";

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const sortMissions = (query) => query.sort({ status: 1, priority: 1, createdAt: 1 });

export const updateWeeklyMissions = async ({ user, forceRegenerate = false } = {}) => {
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const currentWeekWorkouts = await Workout.find({
    userId: user._id,
    date: { $gte: weekStart, $lte: weekEnd }
  }).sort({ date: -1, createdAt: -1 });

  await Mission.updateMany(
    { userId: user._id, status: "active", endDate: { $lt: weekStart } },
    { $set: { status: "expired" } }
  );
  await WeeklyTarget.updateMany(
    { userId: user._id, status: "active", weekEnd: { $lt: weekStart } },
    { $set: { status: "expired" } }
  );

  let weeklyTarget = await WeeklyTarget.findOne({ userId: user._id, weekStart });

  if (!weeklyTarget) {
    weeklyTarget = await WeeklyTarget.create(generateWeeklyTargets({ user, weekStart, weekEnd }));
  }

  if (forceRegenerate) {
    await Mission.updateMany(
      { userId: user._id, startDate: weekStart, endDate: weekEnd, status: "active" },
      { $set: { status: "expired" } }
    );
  }

  let activeMissions = await Mission.find({
    userId: user._id,
    startDate: weekStart,
    endDate: weekEnd,
    status: "active"
  });

  const [
    recoveryScores,
    weakPoints,
    trainingBalance,
    overloadRecommendations,
    deloadRecommendations,
    muscleRanks,
    personalRecords
  ] = await Promise.all([
    RecoveryScore.find({ userId: user._id }),
    WeakPoint.find({ userId: user._id, active: true }),
    TrainingBalance.findOne({ userId: user._id }).sort({ updatedAt: -1 }),
    OverloadRecommendation.find({ userId: user._id, status: "active" }),
    DeloadRecommendation.find({ userId: user._id, status: "active" }),
    MuscleRank.find({ userId: user._id }),
    PersonalRecord.find({ userId: user._id })
  ]);

  if (!activeMissions.length) {
    const missionPayloads = generateWeeklyMissions({
      user,
      currentWeekWorkouts,
      weeklyTarget,
      recoveryScores,
      weakPoints,
      trainingBalance,
      overloadRecommendations,
      deloadRecommendations,
      muscleRanks,
      weekStart,
      weekEnd
    });

    activeMissions = missionPayloads.length
      ? await Mission.insertMany(missionPayloads.map((mission) => ({ userId: user._id, ...mission })))
      : [];
  }

  const progressResult = await updateMissionProgress({
    user,
    missions: activeMissions,
    weeklyTarget,
    personalRecords,
    deloadRecommendations
  });

  const refreshedActive = await Mission.find({
    userId: user._id,
    startDate: weekStart,
    endDate: weekEnd,
    status: "active"
  });
  const completedThisWeek = await Mission.find({
    userId: user._id,
    startDate: weekStart,
    endDate: weekEnd,
    status: "completed"
  }).sort({ completedAt: -1 });
  const streaks = await Streak.find({ userId: user._id, active: true });
  const sortedActive = refreshedActive.sort(
    (a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  );

  return {
    weeklyTarget: progressResult.weeklyTarget,
    activeMissions: sortedActive,
    completedMissions: completedThisWeek,
    newlyCompletedMissions: progressResult.newlyCompletedMissions,
    streaks,
    missionSummary: {
      activeCount: sortedActive.length,
      completedThisWorkout: progressResult.newlyCompletedMissions.length,
      completedThisWeek: completedThisWeek.length,
      weeklyProgress: `${progressResult.weeklyTarget.completedWorkouts}/${progressResult.weeklyTarget.targetWorkouts} workouts completed`
    }
  };
};
