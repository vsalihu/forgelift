export const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Full Body"];

export const MUSCLE_GROUP_EXERCISES = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Press", "Dips"],
  Back: ["Pull-up", "Lat Pulldown", "Barbell Row", "Deadlift"],
  Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Deadlift"],
  Shoulders: ["Overhead Press", "Lateral Raise"],
  Arms: ["Bicep Curl", "Tricep Pushdown"],
  Core: ["Plank"],
  Glutes: ["Hip Thrust", "Squat", "Romanian Deadlift", "Deadlift", "Leg Press"],
  "Full Body": ["Deadlift", "Squat"]
};

export const MUSCLE_GROUP_ALIASES = {
  Chest: ["Chest", "Upper Chest"],
  Back: ["Back", "Lower Back", "Rear Shoulders", "Grip"],
  Legs: ["Legs", "Hamstrings"],
  Shoulders: ["Shoulders", "Front Shoulders", "Rear Shoulders", "Traps"],
  Arms: ["Arms", "Biceps", "Triceps", "Forearms"],
  Core: ["Core"],
  Glutes: ["Glutes"],
  "Full Body": ["Back", "Legs", "Glutes", "Hamstrings", "Core", "Lower Back"]
};

export const getMuscleGroupsForExercise = (exerciseName) => {
  return MUSCLE_GROUPS.filter((group) => MUSCLE_GROUP_EXERCISES[group].includes(exerciseName));
};
