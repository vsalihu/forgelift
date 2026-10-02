// Shared helpers for exercise cards, the picker, the library and the workout builder.
// Role colours match the muscle-load chart on Workout Detail (validated palette).
export const ROLES = {
  primary: { label: "Primary", color: "#d95926" },
  secondary: { label: "Secondary", color: "#3987e5" },
  stabiliser: { label: "Stabiliser", color: "#199e70" }
};

export const titleCase = (value = "") => String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());

const roleOf = (exercise, muscle) => {
  if (exercise.primaryMuscles?.includes(muscle)) return "primary";
  if (exercise.stabiliserMuscles?.includes(muscle)) return "stabiliser";
  return "secondary";
};

// [{ muscle, value, role }] sorted by role then impact. Falls back to the muscle lists when there's no impact profile.
export const muscleImpacts = (exercise = {}) => {
  const profile = exercise.impactProfile || {};
  const entries = Object.keys(profile).length
    ? Object.entries(profile).map(([muscle, value]) => ({ muscle, value: Number(value) || 0, role: roleOf(exercise, muscle) }))
    : [
        ...(exercise.primaryMuscles || []).map((muscle) => ({ muscle, value: 100, role: "primary" })),
        ...(exercise.secondaryMuscles || []).map((muscle) => ({ muscle, value: 40, role: "secondary" })),
        ...(exercise.stabiliserMuscles || []).map((muscle) => ({ muscle, value: 15, role: "stabiliser" }))
      ];
  const order = { primary: 0, secondary: 1, stabiliser: 2 };
  return entries.sort((a, b) => order[a.role] - order[b.role] || b.value - a.value);
};

export const repRange = (exercise) =>
  exercise.defaultRepMin && exercise.defaultRepMax ? `${exercise.defaultRepMin}-${exercise.defaultRepMax} reps` : "";

export const exerciseMeta = (exercise) =>
  [exercise.equipment ? titleCase(exercise.equipment) : "", exercise.exerciseType ? titleCase(exercise.exerciseType) : "", repRange(exercise)].filter(Boolean).join(" · ");

// Sets each muscle gets from a workout: a full set at 100% impact, a share of one below that.
export const setsPerMuscle = (templateExercises = [], findExercise) => {
  const totals = {};
  templateExercises.forEach((item) => {
    const exercise = findExercise(item);
    if (!exercise) return;
    const sets = Number(item.targetSets) || 0;
    muscleImpacts(exercise).forEach(({ muscle, value, role }) => {
      if (!totals[muscle]) totals[muscle] = { muscle, sets: 0, role };
      totals[muscle].sets += (sets * value) / 100;
      if (role === "primary") totals[muscle].role = "primary";
    });
  });
  return Object.values(totals)
    .filter((entry) => entry.sets >= 0.5)
    .sort((a, b) => b.sets - a.sets);
};
