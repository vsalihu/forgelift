import { GROUP_LABELS, GROUP_MUSCLES } from "./workoutTypeConfig.js";

const MEANINGFUL_GROUP_LOAD = 300;
const DIRECT_GROUP_TRAINED = 200;
const roundOne = (value) => Math.round((value || 0) * 10) / 10;

const getWeightedLoad = (load = {}) =>
  (load.directLoad || 0) + (load.indirectLoad || 0) * 0.5 + (load.stabiliserLoad || 0) * 0.25;

const emptyGroupMap = (initialValue) =>
  Object.keys(GROUP_MUSCLES).reduce((map, group) => {
    map[group] = typeof initialValue === "function" ? initialValue() : initialValue;
    return map;
  }, {});

export const getWeeklyMuscleCoverage = ({ workouts = [] } = {}) => {
  const directLoadByGroup = emptyGroupMap(0);
  const weightedLoadByGroup = emptyGroupMap(0);
  const lastTrainedAtByGroup = emptyGroupMap(null);

  workouts.forEach((workout) => {
    const workoutDate = workout.date ? new Date(workout.date) : workout.createdAt ? new Date(workout.createdAt) : null;

    Object.entries(GROUP_MUSCLES).forEach(([group, muscles]) => {
      let workoutDirect = 0;
      let workoutWeighted = 0;

      muscles.forEach((muscle) => {
        const load = workout.muscleLoadSummary?.[muscle] || workout.groupedMuscleLoadSummary?.[muscle] || {};
        workoutDirect += load.directLoad || 0;
        workoutWeighted += getWeightedLoad(load);
      });

      directLoadByGroup[group] += workoutDirect;
      weightedLoadByGroup[group] += workoutWeighted;

      if (workoutDate && (workoutDirect >= DIRECT_GROUP_TRAINED || workoutWeighted >= MEANINGFUL_GROUP_LOAD)) {
        const currentLast = lastTrainedAtByGroup[group] ? new Date(lastTrainedAtByGroup[group]) : null;
        if (!currentLast || workoutDate > currentLast) lastTrainedAtByGroup[group] = workoutDate;
      }
    });
  });

  const trainedGroups = Object.entries(directLoadByGroup).reduce((map, [group, directLoad]) => {
    map[group] = directLoad >= DIRECT_GROUP_TRAINED || weightedLoadByGroup[group] >= MEANINGFUL_GROUP_LOAD;
    return map;
  }, {});

  const missingGroups = Object.keys(GROUP_MUSCLES).filter((group) => !trainedGroups[group]);
  const undertrainedGroups = Object.keys(GROUP_MUSCLES).filter(
    (group) => trainedGroups[group] && directLoadByGroup[group] < DIRECT_GROUP_TRAINED * 2
  );

  return {
    trainedGroups,
    directLoadByGroup: Object.fromEntries(Object.entries(directLoadByGroup).map(([group, load]) => [group, roundOne(load)])),
    weightedLoadByGroup: Object.fromEntries(Object.entries(weightedLoadByGroup).map(([group, load]) => [group, roundOne(load)])),
    lastTrainedAtByGroup,
    missingGroups,
    undertrainedGroups,
    labels: GROUP_LABELS
  };
};
