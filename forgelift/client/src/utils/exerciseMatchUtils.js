import { advancedMuscleFilters, broadMuscleFilters, getRelatedMuscleNames } from "./muscleTaxonomy.js";

export const muscleFilters = broadMuscleFilters;
export { advancedMuscleFilters, broadMuscleFilters };

const normalize = (value = "") => String(value).toLowerCase();
const includesTarget = (value, target) => normalize(value).includes(normalize(target)) || normalize(target).includes(normalize(value));
const targetMatches = (value, targets = []) => targets.some((target) => includesTarget(value, target));

export const getExerciseMatch = (exercise, muscle) => {
  if (!muscle || muscle === "All") return { rank: 0, matchType: "", matchMuscle: "", matchPercentage: null };

  const impactProfile = exercise.impactProfile || {};
  const targets = getRelatedMuscleNames(muscle);
  const findMuscle = (items = []) => items.find((item) => targetMatches(item, targets));
  const primary = findMuscle(exercise.primaryMuscles);
  if (primary) return { rank: 1, matchType: "Primary", matchMuscle: primary, matchPercentage: impactProfile[primary] ?? null };

  const secondary = findMuscle(exercise.secondaryMuscles);
  if (secondary) return { rank: 2, matchType: "Secondary", matchMuscle: secondary, matchPercentage: impactProfile[secondary] ?? null };

  const stabiliser = findMuscle(exercise.stabiliserMuscles);
  if (stabiliser) return { rank: 3, matchType: "Stabiliser", matchMuscle: stabiliser, matchPercentage: impactProfile[stabiliser] ?? null };

  const mainGroup = findMuscle(exercise.mainMuscleGroups);
  if (mainGroup) return { rank: 4, matchType: "Main Group", matchMuscle: mainGroup, matchPercentage: null };

  const detail = findMuscle(exercise.detailedMuscles);
  if (detail) return { rank: 5, matchType: "Detail", matchMuscle: detail, matchPercentage: impactProfile[detail] ?? null };

  if (targetMatches(exercise.category || "", targets)) {
    return { rank: 4, matchType: "Category", matchMuscle: exercise.category, matchPercentage: null };
  }

  const impact = Object.keys(impactProfile).find((item) => targetMatches(item, targets));
  if (impact) return { rank: 5, matchType: "Impact", matchMuscle: impact, matchPercentage: impactProfile[impact] ?? null };

  return null;
};

export const filterAndRankExercises = ({ exercises = [], search = "", muscle = "All", type = "", equipment = "", difficulty = "" }) => {
  const query = normalize(search);

  return exercises
    .map((exercise) => ({ exercise, match: getExerciseMatch(exercise, muscle) }))
    .filter(({ exercise, match }) => {
      if (
        query &&
        ![
          exercise.name,
          exercise.category,
          ...(exercise.mainMuscleGroups || []),
          ...(exercise.detailedMuscles || []),
          ...(exercise.primaryMuscles || []),
          ...(exercise.secondaryMuscles || []),
          ...(exercise.stabiliserMuscles || []),
          ...Object.keys(exercise.impactProfile || {})
        ].some((value) => normalize(value).includes(query))
      ) return false;
      if (muscle && muscle !== "All" && !match) return false;
      if (type && exercise.exerciseType !== type) return false;
      if (equipment && exercise.equipment !== equipment) return false;
      if (difficulty && exercise.difficulty !== difficulty) return false;
      return true;
    })
    .sort((a, b) => (a.match?.rank || 99) - (b.match?.rank || 99) || a.exercise.name.localeCompare(b.exercise.name));
};

export const getMuscleFilterCounts = ({ exercises = [], filters = {}, filterList = [] }) =>
  filterList.reduce((counts, muscle) => {
    const ranked = filterAndRankExercises({
      exercises,
      ...filters,
      muscle
    });
    counts[muscle] = ranked.length;
    return counts;
  }, {});
