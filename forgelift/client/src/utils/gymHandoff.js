// Hands a workout to Gym Mode. Gym Mode reads the template on load and it
// replaces any workout still in progress, so callers confirm that first.
const DRAFT_KEY = "forgeliftGymModeDraft";
const TEMPLATE_KEY = "forgeliftGymModeTemplate";

export const gymDraftInProgress = () => {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    return Boolean((draft?.workout || draft)?.exercises?.length);
  } catch (_error) {
    return false;
  }
};

export const startInGymMode = (template, navigate) => {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(template));
  } catch (_error) {
    // Without storage Gym Mode simply opens empty.
  }
  navigate("/gym-mode");
};

// A logged workout as a Gym Mode template: same exercises and set counts, fresh sets.
export const templateFromWorkout = (workout) => ({
  name: workout.title || "Workout",
  description: "",
  exercises: (workout.exercises || []).map((exercise) => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    exerciseType: exercise.exerciseType || "",
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    stabiliserMuscles: exercise.stabiliserMuscles || [],
    mainMuscleGroups: exercise.mainMuscleGroups || [],
    targetSets: Math.max(1, (exercise.sets || []).length)
  }))
});
