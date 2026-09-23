const detailedMuscleImages = {
  Chest: "chest",
  "Upper Chest": "chest",
  "Mid Chest": "chest",
  "Lower Chest": "chest",
  "Inner Chest": "chest",
  Lats: "lats",
  "Upper Back": "upper-back",
  "Mid Back": "upper-back",
  Rhomboids: "upper-back",
  "Teres Major": "upper-back",
  Traps: "traps",
  "Lower Traps": "traps",
  "Lower Back": "lower-back",
  "Front Delts": "front-delts",
  "Side Delts": "side-delts",
  "Rear Delts": "rear-delts",
  "Rotator Cuff": "rear-delts",
  Biceps: "biceps",
  "Biceps Long Head": "biceps",
  "Biceps Short Head": "biceps",
  Brachialis: "biceps",
  Brachioradialis: "biceps",
  Triceps: "triceps",
  "Triceps Long Head": "triceps",
  "Triceps Lateral Head": "triceps",
  "Triceps Medial Head": "triceps",
  Forearms: "forearms",
  Grip: "forearms",
  Abs: "abs",
  "Transverse Abdominis": "abs",
  Obliques: "obliques",
  "Hip Flexors": "obliques",
  Glutes: "glutes",
  "Glute Maximus": "glutes",
  "Glute Medius": "glutes",
  "Glute Minimus": "glutes",
  Quads: "quads",
  Hamstrings: "hamstrings-calves",
  Calves: "hamstrings-calves",
  Adductors: "quads",
  Abductors: "glutes",
  Tibialis: "hamstrings-calves"
};

const broadMuscleImages = {
  Chest: "chest",
  Back: "upper-back",
  Shoulders: "side-delts",
  Arms: "biceps",
  Legs: "quads",
  Glutes: "glutes",
  Core: "abs"
};

const imageUrl = (file) => (file ? `/muscles/${file}.png` : null);

export const getMuscleImage = (muscleName = "") => imageUrl(detailedMuscleImages[muscleName]);

export const getBroadMuscleImage = (broadGroup = "") => imageUrl(broadMuscleImages[broadGroup]);
