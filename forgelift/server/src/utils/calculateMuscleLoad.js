import { getLoadLevel } from "./getLoadLevel.js";
import { getBroadGroupsForMuscle, normalizeMuscleName } from "./muscleTaxonomy.js";

const getIntensityModifier = (rpe) => {
  const numericRpe = Number(rpe);

  if (!numericRpe) return 1;
  if (numericRpe <= 5) return 0.7;
  if (numericRpe === 6) return 0.8;
  if (numericRpe === 7) return 0.9;
  if (numericRpe === 8) return 1;
  if (numericRpe === 9) return 1.15;
  return 1.3;
};

const getMuscleRole = (muscle, exercise) => {
  const normalized = normalizeMuscleName(muscle);
  if (exercise.primaryMuscles?.map(normalizeMuscleName).includes(normalized)) return "directLoad";
  if (exercise.secondaryMuscles?.map(normalizeMuscleName).includes(normalized)) return "indirectLoad";
  if (exercise.stabiliserMuscles?.map(normalizeMuscleName).includes(normalized)) return "stabiliserLoad";
  return "indirectLoad";
};

const addLoad = (summary, muscle, role, load) => {
  const normalizedMuscle = normalizeMuscleName(muscle);
  if (!summary[normalizedMuscle]) {
    summary[normalizedMuscle] = {
      directLoad: 0,
      indirectLoad: 0,
      stabiliserLoad: 0,
      totalLoad: 0,
      loadLevel: "Low"
    };
  }
  summary[normalizedMuscle][role] += load;
};

export const finaliseMuscleLoadSummary = (summary = {}) => {
  Object.values(summary).forEach((entry) => {
    entry.directLoad = Math.round(entry.directLoad * 10) / 10;
    entry.indirectLoad = Math.round(entry.indirectLoad * 10) / 10;
    entry.stabiliserLoad = Math.round(entry.stabiliserLoad * 10) / 10;
    entry.totalLoad = Math.round((entry.directLoad + entry.indirectLoad + entry.stabiliserLoad) * 10) / 10;
    entry.loadLevel = getLoadLevel(entry.totalLoad);
  });
  return summary;
};

export const calculateMuscleLoad = (exercises = []) => {
  const summary = {};

  exercises.forEach((exercise) => {
    const impactProfile = exercise.impactProfile || {};

    exercise.sets?.forEach((set) => {
      if (set.completed === false) return;

      const setVolume = Number(set.setVolume) || 0;
      const intensityModifier = getIntensityModifier(set.rpe);

      Object.entries(impactProfile).forEach(([rawMuscle, impact]) => {
        const muscle = normalizeMuscleName(rawMuscle);
        const impactPercentage = (Number(impact) || 0) / 100;
        const load = setVolume * impactPercentage * intensityModifier;
        const role = getMuscleRole(muscle, exercise);
        addLoad(summary, muscle, role, load);
      });
    });
  });

  return finaliseMuscleLoadSummary(summary);
};

export const groupMuscleLoadSummary = (muscleLoadSummary = {}) => {
  const grouped = {};
  Object.entries(muscleLoadSummary).forEach(([muscle, load]) => {
    getBroadGroupsForMuscle(muscle).forEach((group) => {
      if (group === muscle) return;
      if (!grouped[group]) {
        grouped[group] = { directLoad: 0, indirectLoad: 0, stabiliserLoad: 0, totalLoad: 0, loadLevel: "Low" };
      }
      grouped[group].directLoad += (load.directLoad || 0) * 0.7;
      grouped[group].indirectLoad += (load.indirectLoad || 0) * 0.7;
      grouped[group].stabiliserLoad += (load.stabiliserLoad || 0) * 0.7;
    });
  });
  return finaliseMuscleLoadSummary(grouped);
};
