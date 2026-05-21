const requiredMuscleGroups = ["Chest", "Back", "Legs"];

const getWorkoutMuscles = (workouts = []) => {
  const muscles = new Set();

  workouts.forEach((workout) => {
    Object.entries(workout.muscleLoadSummary || workout.muscleVolumeSummary || {}).forEach(([muscle, load]) => {
      const directLoad = typeof load === "object" ? load.directLoad || load.volume || load.totalLoad || 0 : load || 0;
      if (directLoad > 0) muscles.add(muscle);
    });
  });

  return [...muscles];
};

export const getUserDataReadiness = ({ user, workouts = [], baselines = [] }) => {
  const workoutCount = workouts.length;
  const trainedMuscleGroups = getWorkoutMuscles(workouts);
  const hasAssessment = Boolean(user?.assessmentCompleted);
  const hasStrengthBaselines = baselines.some((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
  const hasBodyweight = Boolean(Number(user?.bodyweight) > 0);
  const missingMuscleGroups = requiredMuscleGroups.filter(
    (muscle) => !trainedMuscleGroups.some((trained) => trained === muscle || trained.includes(muscle))
  );

  let overallReadiness = "empty";
  if (workoutCount >= 3 && trainedMuscleGroups.length >= 2) overallReadiness = "ready";
  else if (workoutCount >= 1) overallReadiness = "learning";
  else if (hasAssessment || hasStrengthBaselines || hasBodyweight) overallReadiness = "starting";

  const messages = [];
  const recommendedActions = [];

  if (!hasAssessment) {
    messages.push("ForgeLift Assessment is not complete.");
    recommendedActions.push({ label: "Complete Assessment", to: "/assessment" });
  }

  if (!hasBodyweight) {
    messages.push("Bodyweight is missing, so bodyweight-ratio strength estimates are limited.");
    recommendedActions.push({ label: "Update Profile", to: "/profile" });
  }

  if (!hasStrengthBaselines) {
    messages.push("No user-entered strength baselines are saved.");
    recommendedActions.push({ label: "Add Strength Baselines", to: "/strength-baselines" });
  }

  if (workoutCount === 0) {
    messages.push("No workouts logged yet.");
    recommendedActions.push({ label: "Start Gym Mode", to: "/gym-mode" });
  } else if (workoutCount < 3) {
    messages.push("ForgeLift is still learning from your training history.");
    recommendedActions.push({ label: "Log More Workouts", to: "/gym-mode" });
  }

  missingMuscleGroups.forEach((muscle) => {
    messages.push(`No direct ${muscle.toLowerCase()} training data logged yet.`);
  });

  return {
    overallReadiness,
    workoutCount,
    hasAssessment,
    hasStrengthBaselines,
    hasBodyweight,
    trainedMuscleGroups,
    missingMuscleGroups,
    enoughForRecovery: workoutCount >= 1,
    enoughForOverload: workoutCount >= 3,
    enoughForWeakPoints: workoutCount >= 3 && trainedMuscleGroups.length >= 2,
    enoughForTrainingBalance: workoutCount >= 3 && trainedMuscleGroups.length >= 2,
    enoughForDeload: workoutCount >= 3,
    messages,
    recommendedActions: recommendedActions.slice(0, 5)
  };
};
