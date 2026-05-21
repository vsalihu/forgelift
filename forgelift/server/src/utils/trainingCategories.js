export const TRAINING_CATEGORIES = {
  push: ["Chest", "Upper Chest", "Mid Chest", "Lower Chest", "Shoulders", "Front Delts", "Side Delts", "Triceps", "Triceps Long Head", "Triceps Lateral Head", "Triceps Medial Head"],
  pull: ["Back", "Lats", "Upper Back", "Mid Back", "Rear Delts", "Rhomboids", "Biceps", "Biceps Long Head", "Biceps Short Head", "Brachialis", "Brachioradialis", "Grip"],
  upper: [
    "Chest",
    "Upper Chest",
    "Mid Chest",
    "Lower Chest",
    "Back",
    "Lats",
    "Upper Back",
    "Mid Back",
    "Shoulders",
    "Front Delts",
    "Side Delts",
    "Rear Delts",
    "Arms",
    "Biceps",
    "Brachialis",
    "Brachioradialis",
    "Triceps",
    "Core"
  ],
  lower: ["Legs", "Quads", "Glutes", "Glute Maximus", "Glute Medius", "Glute Minimus", "Hamstrings", "Calves", "Adductors", "Abductors", "Tibialis"],
  front: ["Chest", "Upper Chest", "Mid Chest", "Lower Chest", "Front Delts", "Quads", "Legs", "Core", "Abs"],
  rear: ["Back", "Lats", "Upper Back", "Mid Back", "Rhomboids", "Teres Major", "Rear Delts", "Glutes", "Glute Maximus", "Glute Medius", "Hamstrings", "Lower Back"],
  core: ["Core", "Abs", "Obliques", "Transverse Abdominis", "Hip Flexors"],
  gluteHamstring: ["Glutes", "Glute Maximus", "Glute Medius", "Glute Minimus", "Hamstrings", "Abductors"]
};

export const MAJOR_MUSCLES = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Lower Back"
];

export const isInCategory = (muscle, category) => {
  return (TRAINING_CATEGORIES[category] || []).includes(muscle);
};
