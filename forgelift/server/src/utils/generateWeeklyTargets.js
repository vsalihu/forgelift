const experienceTargets = {
  Beginner: 2,
  Intermediate: 3,
  Advanced: 4
};

const goalMuscles = {
  "Strength Warrior": ["Chest", "Back", "Legs"],
  "Muscle Builder": ["Chest", "Back", "Legs", "Shoulders", "Arms"],
  "Fat Loss Fighter": ["Core", "Legs", "Back"],
  "Athletic Performance": ["Back", "Core", "Legs", "Glutes"],
  "Beginner Foundation": ["Chest", "Back", "Legs"],
  "Balanced Beast": ["Chest", "Back", "Legs", "Shoulders", "Core"],
  "Glute Growth": ["Glutes", "Hamstrings", "Legs"]
};

export const generateWeeklyTargets = ({ user, weekStart, weekEnd }) => {
  const experience = user.trainingExperience || "Beginner";
  const goalPath = user.goalPath || "Balanced Beast";
  let targetWorkouts = experienceTargets[experience] || 3;

  if (goalPath === "Fat Loss Fighter") targetWorkouts += 1;
  if (goalPath === "Strength Warrior") targetWorkouts = Math.max(3, Math.min(targetWorkouts, 4));
  if (goalPath === "Muscle Builder") targetWorkouts = Math.max(3, targetWorkouts);
  if (goalPath === "Beginner Foundation") targetWorkouts = Math.min(targetWorkouts, 3);
  if (goalPath === "Glute Growth") targetWorkouts = Math.max(3, targetWorkouts);

  const targetMuscleGroups = goalMuscles[goalPath] || goalMuscles["Balanced Beast"];
  const targetDirectMuscleLoads = targetMuscleGroups.reduce((loads, muscle) => {
    loads[muscle] = goalPath === "Glute Growth" && muscle === "Glutes" ? 1200 : 600;
    return loads;
  }, {});

  return {
    userId: user._id,
    weekStart,
    weekEnd,
    targetWorkouts,
    completedWorkouts: 0,
    targetVolume: targetWorkouts * 2500,
    completedVolume: 0,
    targetMuscleGroups,
    completedMuscleGroups: [],
    targetDirectMuscleLoads,
    completedDirectMuscleLoads: {},
    status: "active"
  };
};
