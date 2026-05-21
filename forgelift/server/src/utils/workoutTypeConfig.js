export const WORKOUT_TYPES = [
  {
    name: "Push Day",
    mainGroups: ["push"],
    muscles: ["Chest", "Upper Chest", "Mid Chest", "Shoulders", "Front Delts", "Side Delts", "Triceps"]
  },
  {
    name: "Pull Day",
    mainGroups: ["pull"],
    muscles: ["Back", "Lats", "Upper Back", "Mid Back", "Rhomboids", "Teres Major", "Rear Delts", "Biceps", "Brachialis", "Grip"]
  },
  {
    name: "Leg Day",
    mainGroups: ["legs", "hamstrings", "glutes"],
    muscles: ["Legs", "Quads", "Hamstrings", "Glutes", "Glute Maximus", "Glute Medius", "Calves", "Adductors", "Abductors", "Tibialis"]
  },
  {
    name: "Glute/Lower Body",
    mainGroups: ["glutes", "hamstrings", "legs"],
    muscles: ["Glutes", "Hamstrings", "Legs", "Lower Back"]
  },
  {
    name: "Core + Conditioning",
    mainGroups: ["core"],
    muscles: ["Core", "Cardio"]
  },
  {
    name: "Full Body",
    mainGroups: ["push", "pull", "legs", "core"],
    muscles: ["Chest", "Back", "Legs", "Core", "Shoulders", "Glutes"]
  },
  {
    name: "Rest / Mobility",
    mainGroups: [],
    muscles: []
  }
];

export const GROUP_MUSCLES = {
  push: ["Chest", "Upper Chest", "Mid Chest", "Lower Chest", "Inner Chest", "Shoulders", "Front Delts", "Side Delts", "Triceps", "Triceps Long Head", "Triceps Lateral Head", "Triceps Medial Head"],
  pull: ["Back", "Lats", "Upper Back", "Mid Back", "Rhomboids", "Teres Major", "Rear Delts", "Biceps", "Biceps Long Head", "Biceps Short Head", "Brachialis", "Brachioradialis", "Grip"],
  legs: ["Legs", "Quads", "Hamstrings", "Calves", "Adductors", "Abductors", "Tibialis"],
  glutes: ["Glutes", "Glute Maximus", "Glute Medius", "Glute Minimus", "Abductors"],
  hamstrings: ["Hamstrings"],
  core: ["Core"]
};

export const GROUP_LABELS = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  core: "Core"
};
