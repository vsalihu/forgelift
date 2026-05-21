import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
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
import { calculateXP } from "./calculateXP.js";
import { recalculateUserRanks } from "./calculateRanks.js";
import { detectPersonalRecords } from "./detectPersonalRecords.js";
import { recalculateRecoveryFromWorkouts } from "./recalculateRecoveryFromWorkouts.js";
import { updateDeloadRecommendations } from "./updateDeloadRecommendations.js";
import { updateOverloadRecommendations } from "./updateOverloadRecommendations.js";
import { updateWeakPoints } from "./updateWeakPoints.js";
import { updateWeeklyMissions } from "./updateWeeklyMissions.js";

const clearDerivedData = async (userId, { clearMissions = true, clearReports = true } = {}) => {
  const deletes = [
    PersonalRecord.deleteMany({ userId }),
    MuscleRank.deleteMany({ userId }),
    RecoveryScore.deleteMany({ userId }),
    WeakPoint.deleteMany({ userId }),
    TrainingBalance.deleteMany({ userId }),
    OverloadRecommendation.deleteMany({ userId }),
    DeloadRecommendation.deleteMany({ userId })
  ];

  if (clearMissions) {
    deletes.push(Mission.deleteMany({ userId }), WeeklyTarget.deleteMany({ userId }), Streak.deleteMany({ userId }));
  }

  if (clearReports) {
    deletes.push(AnalyticsSnapshot.deleteMany({ userId }), MonthlyReport.deleteMany({ userId }));
  }

  await Promise.all(deletes);
};

export const recalculateUserTrainingState = async ({
  user,
  clearMissions = true,
  clearReports = true
} = {}) => {
  await clearDerivedData(user._id, { clearMissions, clearReports });

  const workouts = await Workout.find({ userId: user._id }).sort({ date: 1, createdAt: 1 });
  let rebuiltXp = 0;

  for (const workout of workouts) {
    const newPersonalRecords = await detectPersonalRecords({ userId: user._id, workout });
    rebuiltXp += calculateXP({ workout, newPersonalRecords });
  }

  user.xp = rebuiltXp;
  user.overallRankScore = 0;
  user.currentOverallRank = "Copper";
  user.lastRankCheck = null;
  await user.save();

  const updatedRanks = await recalculateUserRanks(user);
  const recentRecoveryWorkouts = workouts
    .filter((workout) => new Date(workout.date) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const recoveryScores = await recalculateRecoveryFromWorkouts({ user, recentWorkouts: recentRecoveryWorkouts });
  const weakPointResult = await updateWeakPoints(user);
  const overloadRecommendations = workouts.length ? await updateOverloadRecommendations({ user }) : [];
  const deloadResult = await updateDeloadRecommendations(user);
  const missionResult = clearMissions ? await updateWeeklyMissions({ user, forceRegenerate: true }) : null;

  return {
    workoutCount: workouts.length,
    personalRecordCount: await PersonalRecord.countDocuments({ userId: user._id }),
    updatedRanks,
    recoveryScores,
    trainingBalance: weakPointResult.trainingBalance,
    weakPoints: weakPointResult.weakPoints,
    overloadRecommendations,
    deloadRecommendations: deloadResult.deloadRecommendations,
    missionSummary: missionResult?.missionSummary || null
  };
};
