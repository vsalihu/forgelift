import RecoveryScore from "../models/RecoveryScore.js";
import { calculateRecoveryScore } from "./calculateRecoveryScore.js";
import { getLoadLevel } from "./getLoadLevel.js";

export const BASE_RECOVERY_MUSCLES = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Biceps",
  "Triceps",
  "Core",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Lower Back",
  "Full Body"
];

const emptyLoadData = () => ({
  lastDirectLoad: 0,
  lastIndirectLoad: 0,
  lastStabiliserLoad: 0,
  lastTotalLoad: 0,
  lastDirectLoadAt: null,
  lastIndirectLoadAt: null,
  lastStabiliserLoadAt: null,
  latestWorkoutId: null,
  latestWorkout: null
});

const maybeUpdateLatest = ({ currentDate, newDate }) => {
  if (!currentDate) return true;
  return new Date(newDate).getTime() > new Date(currentDate).getTime();
};

const updateLoadRole = ({ loadData, role, load, workout }) => {
  const date = workout.date || workout.createdAt;
  const loadKey = `last${role}Load`;
  const dateKey = `last${role}LoadAt`;

  if (maybeUpdateLatest({ currentDate: loadData[dateKey], newDate: date })) {
    loadData[loadKey] = load;
    loadData[dateKey] = date;
  }

  if (!loadData.latestWorkout || new Date(date).getTime() > new Date(loadData.latestWorkout.date).getTime()) {
    loadData.latestWorkout = workout;
    loadData.latestWorkoutId = workout._id;
  }
};

export const recalculateRecoveryFromWorkouts = async ({ user, recentWorkouts = [] }) => {
  const byMuscle = {};

  BASE_RECOVERY_MUSCLES.forEach((muscle) => {
    byMuscle[muscle] = emptyLoadData();
  });

  recentWorkouts.forEach((workout) => {
    Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
      byMuscle[muscle] = byMuscle[muscle] || emptyLoadData();

      if ((load.directLoad || 0) > 0) {
        updateLoadRole({ loadData: byMuscle[muscle], role: "Direct", load: load.directLoad || 0, workout });
      }

      if ((load.indirectLoad || 0) > 0) {
        updateLoadRole({ loadData: byMuscle[muscle], role: "Indirect", load: load.indirectLoad || 0, workout });
      }

      if ((load.stabiliserLoad || 0) > 0) {
        updateLoadRole({ loadData: byMuscle[muscle], role: "Stabiliser", load: load.stabiliserLoad || 0, workout });
      }
    });
  });

  const mediumHighMuscleCount = Object.values(byMuscle).filter((loadData) => {
    const total = (loadData.lastDirectLoad || 0) + (loadData.lastIndirectLoad || 0) + (loadData.lastStabiliserLoad || 0);
    const level = getLoadLevel(total);
    return level === "Medium" || level === "High" || level === "Very High";
  }).length;

  const updatedScores = await Promise.all(
    Object.entries(byMuscle).map(async ([muscleGroup, loadData]) => {
      const totalLoad = (loadData.lastDirectLoad || 0) + (loadData.lastIndirectLoad || 0) + (loadData.lastStabiliserLoad || 0);
      const recovery = calculateRecoveryScore({
        user,
        muscleGroup,
        loadData,
        latestWorkout: loadData.latestWorkout,
        mediumHighMuscleCount
      });

      const update = {
        ...recovery,
        lastTotalLoad: totalLoad,
        lastDirectLoad: loadData.lastDirectLoad || 0,
        lastIndirectLoad: loadData.lastIndirectLoad || 0,
        lastStabiliserLoad: loadData.lastStabiliserLoad || 0,
        lastDirectLoadAt: loadData.lastDirectLoadAt,
        lastIndirectLoadAt: loadData.lastIndirectLoadAt,
        lastStabiliserLoadAt: loadData.lastStabiliserLoadAt,
        latestWorkoutId: loadData.latestWorkoutId
      };

      return RecoveryScore.findOneAndUpdate(
        { userId: user._id, muscleGroup },
        { $set: { userId: user._id, ...update } },
        { new: true, upsert: true }
      );
    })
  );

  return updatedScores.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
};
