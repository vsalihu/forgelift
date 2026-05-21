import Mission from "../models/Mission.js";
import Streak from "../models/Streak.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import Workout from "../models/Workout.js";
import { isDateInRange } from "./weekUtils.js";

const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

const getDirectLoad = (workout, muscle) => Number(workout.muscleLoadSummary?.[muscle]?.directLoad) || 0;

const workoutHasDirectMuscle = (workout, muscles = []) =>
  muscles.some((muscle) => getDirectLoad(workout, muscle) > 0);

const workoutHasHeavyDirectMuscle = (workout, muscles = []) =>
  muscles.some((muscle) => getDirectLoad(workout, muscle) >= 800);

const getWorkoutsInRange = (workouts, start, end) =>
  workouts.filter((workout) => isDateInRange(workout.date, start, end));

const calculateMissionCurrentValue = ({ mission, workouts, personalRecords = [], deloadRecommendations = [] }) => {
  const rangeWorkouts = getWorkoutsInRange(workouts, mission.startDate, mission.endDate);

  if (["workout_frequency", "consistency"].includes(mission.missionType)) {
    return rangeWorkouts.length;
  }

  if (["muscle_focus", "weak_point_fix", "training_balance", "goal_path"].includes(mission.missionType)) {
    return rangeWorkouts.filter((workout) => workoutHasDirectMuscle(workout, mission.targetMuscleGroups)).length;
  }

  if (mission.missionType === "overload_target") {
    const matchingWorkouts = rangeWorkouts.filter((workout) =>
      workout.exercises?.some((exercise) => exercise.exerciseName === mission.targetExerciseName)
    );
    const targetWeight = Number(mission.targetValue) || 0;
    return matchingWorkouts.some((workout) =>
      workout.exercises?.some((exercise) => {
        if (exercise.exerciseName !== mission.targetExerciseName) return false;
        const heaviest = Math.max(...(exercise.sets || []).filter((set) => set.completed !== false).map((set) => Number(set.weight) || 0), 0);
        return targetWeight ? heaviest >= targetWeight : (exercise.exerciseTotalVolume || 0) > 0;
      })
    )
      ? 1
      : 0;
  }

  if (mission.missionType === "recovery_discipline") {
    return rangeWorkouts.some((workout) => workoutHasHeavyDirectMuscle(workout, mission.targetMuscleGroups)) ? 0 : 1;
  }

  if (mission.missionType === "deload_compliance") {
    const deloadId = mission.evidence?.deloadRecommendationId?.toString();
    const matchingDeload = deloadRecommendations.find((deload) => deload._id?.toString() === deloadId);
    if (matchingDeload?.status === "completed") return 1;

    const targetExerciseName = mission.targetExerciseName;
    if (targetExerciseName) {
      const exerciseWorkouts = rangeWorkouts
        .filter((workout) => workout.exercises?.some((exercise) => exercise.exerciseName === targetExerciseName))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (exerciseWorkouts.length < 2) return 0;
      const first = exerciseWorkouts[0].exercises.find((exercise) => exercise.exerciseName === targetExerciseName);
      const latest = exerciseWorkouts[exerciseWorkouts.length - 1].exercises.find(
        (exercise) => exercise.exerciseName === targetExerciseName
      );
      return (latest?.exerciseTotalVolume || 0) < (first?.exerciseTotalVolume || 0) ? 1 : 0;
    }

    return rangeWorkouts.some((workout) => workoutHasHeavyDirectMuscle(workout, mission.targetMuscleGroups)) ? 0 : 1;
  }

  if (mission.missionType === "pr_challenge") {
    return personalRecords.some(
      (record) =>
        isDateInRange(record.achievedAt || record.createdAt, mission.startDate, mission.endDate) &&
        (!mission.targetExerciseName || record.exerciseName === mission.targetExerciseName)
    )
      ? 1
      : 0;
  }

  return 0;
};

const updateStreak = async ({ userId, streakType }) => {
  const streak = await Streak.findOneAndUpdate(
    { userId, streakType },
    { $setOnInsert: { userId, streakType, currentCount: 0, bestCount: 0, active: true } },
    { new: true, upsert: true }
  );

  const today = new Date();
  const lastUpdated = streak.lastUpdated ? new Date(streak.lastUpdated) : null;
  const alreadyUpdatedThisWeek =
    lastUpdated &&
    today.getFullYear() === lastUpdated.getFullYear() &&
    Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / 604800000) ===
      Math.ceil((lastUpdated - new Date(lastUpdated.getFullYear(), 0, 1)) / 604800000);

  if (!alreadyUpdatedThisWeek) {
    streak.currentCount += 1;
    streak.bestCount = Math.max(streak.bestCount, streak.currentCount);
    streak.lastUpdated = today;
    streak.active = true;
    await streak.save();
  }

  return streak;
};

export const updateWeeklyTargetProgress = async ({ weeklyTarget, workouts }) => {
  const rangeWorkouts = getWorkoutsInRange(workouts, weeklyTarget.weekStart, weeklyTarget.weekEnd);
  const completedDirectMuscleLoads = {};

  rangeWorkouts.forEach((workout) => {
    Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
      if ((load.directLoad || 0) > 0) {
        completedDirectMuscleLoads[muscle] = roundOne((completedDirectMuscleLoads[muscle] || 0) + load.directLoad);
      }
    });
  });

  weeklyTarget.completedWorkouts = rangeWorkouts.length;
  weeklyTarget.completedVolume = roundOne(rangeWorkouts.reduce((total, workout) => total + (workout.totalVolume || 0), 0));
  weeklyTarget.completedDirectMuscleLoads = completedDirectMuscleLoads;
  weeklyTarget.completedMuscleGroups = Object.keys(completedDirectMuscleLoads);
  weeklyTarget.status =
    weeklyTarget.completedWorkouts >= weeklyTarget.targetWorkouts &&
    weeklyTarget.targetMuscleGroups.every((muscle) => weeklyTarget.completedMuscleGroups.includes(muscle))
      ? "completed"
      : "active";
  await weeklyTarget.save();
  return weeklyTarget;
};

export const updateMissionProgress = async ({
  user,
  missions,
  weeklyTarget,
  personalRecords = [],
  deloadRecommendations = []
}) => {
  const workouts = await Workout.find({
    userId: user._id,
    date: { $gte: weeklyTarget.weekStart, $lte: weeklyTarget.weekEnd }
  }).sort({ date: -1, createdAt: -1 });
  const completedMissions = [];
  const newlyCompletedMissions = [];

  await updateWeeklyTargetProgress({ weeklyTarget, workouts });

  for (const mission of missions) {
    if (mission.status !== "active") continue;

    const wasCompleted = mission.status === "completed";
    mission.currentValue = calculateMissionCurrentValue({
      mission,
      workouts,
      personalRecords,
      deloadRecommendations
    });
    mission.progressPercentage = Math.min(100, Math.round((mission.currentValue / Math.max(mission.targetValue || 1, 1)) * 100));

    if (mission.currentValue >= mission.targetValue) {
      mission.status = "completed";
      mission.completedAt = mission.completedAt || new Date();
      completedMissions.push(mission);

      if (!wasCompleted) {
        user.xp = (user.xp || 0) + (mission.xpReward || 0);
        newlyCompletedMissions.push(mission);
      }
    }

    await mission.save();
  }

  if (weeklyTarget.status === "completed") {
    await updateStreak({ userId: user._id, streakType: "weekly_workout" });
  }

  if (newlyCompletedMissions.length) {
    await updateStreak({ userId: user._id, streakType: "mission_completion" });
    await user.save();
  }

  const activeMissions = await Mission.find({
    userId: user._id,
    startDate: weeklyTarget.weekStart,
    endDate: weeklyTarget.weekEnd,
    status: "active"
  }).sort({ priority: 1, createdAt: 1 });

  return {
    activeMissions,
    completedMissions,
    newlyCompletedMissions,
    weeklyTarget
  };
};
