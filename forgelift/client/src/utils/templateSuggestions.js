const makeExercise = (exerciseName, targetSets = 3, targetRepMin = 8, targetRepMax = 12) => ({
  exerciseName,
  targetSets,
  targetRepMin,
  targetRepMax,
  notes: ""
});

export const getTemplateSuggestions = (goalPath = "Balanced Beast") => {
  const templates = {
    "Strength Warrior": [
      { name: "Strength Push", exercises: [makeExercise("Bench Press", 3, 5, 8), makeExercise("Overhead Press", 3, 5, 8), makeExercise("Tricep Pushdown")] },
      { name: "Strength Pull", exercises: [makeExercise("Deadlift", 3, 3, 6), makeExercise("Barbell Row", 3, 6, 10), makeExercise("Pull-up", 3, 6, 10)] },
      { name: "Strength Legs", exercises: [makeExercise("Squat", 4, 5, 8), makeExercise("Romanian Deadlift", 3, 6, 10), makeExercise("Leg Press", 3, 8, 12)] }
    ],
    "Muscle Builder": [
      { name: "Hypertrophy Push", exercises: [makeExercise("Bench Press"), makeExercise("Incline Dumbbell Press"), makeExercise("Lateral Raise", 3, 12, 20)] },
      { name: "Hypertrophy Pull", exercises: [makeExercise("Lat Pulldown"), makeExercise("Barbell Row"), makeExercise("Bicep Curl", 3, 10, 15)] },
      { name: "Hypertrophy Legs", exercises: [makeExercise("Squat"), makeExercise("Romanian Deadlift"), makeExercise("Leg Press")] }
    ],
    "Fat Loss Fighter": [
      { name: "Full Body Conditioning", exercises: [makeExercise("Squat"), makeExercise("Lat Pulldown"), makeExercise("Plank", 3, 1, 3)] },
      { name: "Upper + Core", exercises: [makeExercise("Bench Press"), makeExercise("Barbell Row"), makeExercise("Plank", 3, 1, 3)] },
      { name: "Lower + Cardio", exercises: [makeExercise("Leg Press"), makeExercise("Romanian Deadlift"), makeExercise("Plank", 3, 1, 3)] }
    ],
    "Glute Growth": [
      { name: "Glute Focus A", exercises: [makeExercise("Hip Thrust"), makeExercise("Romanian Deadlift"), makeExercise("Leg Press")] },
      { name: "Glute Focus B", exercises: [makeExercise("Squat"), makeExercise("Hip Thrust"), makeExercise("Romanian Deadlift")] },
      { name: "Lower Body Strength", exercises: [makeExercise("Squat", 4, 5, 8), makeExercise("Hip Thrust", 4, 8, 12), makeExercise("Leg Press")] }
    ],
    "Beginner Foundation": [
      { name: "Beginner Full Body A", exercises: [makeExercise("Bench Press"), makeExercise("Lat Pulldown"), makeExercise("Leg Press")] },
      { name: "Beginner Full Body B", exercises: [makeExercise("Overhead Press"), makeExercise("Barbell Row"), makeExercise("Squat")] }
    ],
    "Balanced Beast": [
      { name: "Push", exercises: [makeExercise("Bench Press"), makeExercise("Overhead Press"), makeExercise("Tricep Pushdown")] },
      { name: "Pull", exercises: [makeExercise("Barbell Row"), makeExercise("Lat Pulldown"), makeExercise("Bicep Curl")] },
      { name: "Legs", exercises: [makeExercise("Squat"), makeExercise("Romanian Deadlift"), makeExercise("Leg Press")] },
      { name: "Core/Conditioning", exercises: [makeExercise("Plank", 3, 1, 3), makeExercise("Pull-up"), makeExercise("Lateral Raise", 3, 12, 20)] }
    ]
  };

  return templates[goalPath] || templates["Balanced Beast"];
};
