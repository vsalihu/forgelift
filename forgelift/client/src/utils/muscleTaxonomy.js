export const MUSCLE_TAXONOMY = {
  Chest: ["Upper Chest", "Mid Chest", "Lower Chest", "Inner Chest"],
  Back: ["Lats", "Upper Back", "Mid Back", "Lower Back", "Traps", "Lower Traps", "Rhomboids", "Teres Major"],
  Shoulders: ["Front Delts", "Side Delts", "Rear Delts", "Rotator Cuff", "Traps", "Lower Traps"],
  Arms: [
    "Biceps",
    "Biceps Long Head",
    "Biceps Short Head",
    "Brachialis",
    "Brachioradialis",
    "Triceps",
    "Triceps Long Head",
    "Triceps Lateral Head",
    "Triceps Medial Head",
    "Forearms",
    "Grip"
  ],
  Legs: ["Quads", "Hamstrings", "Calves", "Adductors", "Abductors", "Tibialis"],
  Glutes: ["Glute Maximus", "Glute Medius", "Glute Minimus"],
  Core: ["Abs", "Obliques", "Transverse Abdominis", "Lower Back", "Hip Flexors"],
  "Full Body": ["Full Body"],
  Cardio: ["Cardio"]
};

export const broadMuscleFilters = ["All", ...Object.keys(MUSCLE_TAXONOMY)];

export const advancedMuscleFilters = [
  "Quads",
  "Hamstrings",
  "Calves",
  "Adductors",
  "Abductors",
  "Biceps",
  "Biceps Long Head",
  "Biceps Short Head",
  "Brachialis",
  "Brachioradialis",
  "Triceps",
  "Triceps Long Head",
  "Triceps Lateral Head",
  "Triceps Medial Head",
  "Forearms",
  "Front Delts",
  "Side Delts",
  "Rear Delts",
  "Traps",
  "Upper Chest",
  "Mid Chest",
  "Lower Chest",
  "Lats",
  "Upper Back",
  "Mid Back",
  "Lower Back",
  "Rhomboids",
  "Teres Major",
  "Rotator Cuff",
  "Lower Traps",
  "Inner Chest",
  "Abs",
  "Obliques",
  "Hip Flexors"
];

const aliases = {
  "front shoulders": "Front Delts",
  "rear shoulders": "Rear Delts",
  "rear delts": "Rear Delts",
  "side delts": "Side Delts",
  quadriceps: "Quads",
  quad: "Quads",
  abdominals: "Abs",
  bicep: "Biceps",
  "biceps brachii": "Biceps",
  tricep: "Triceps",
  lat: "Lats"
};

export const normalizeMuscleName = (muscle = "") => {
  const trimmed = String(muscle).trim();
  if (!trimmed) return "";
  return aliases[trimmed.toLowerCase()] || trimmed.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const getBroadGroupsForMuscle = (muscle = "") => {
  const normalized = normalizeMuscleName(muscle);
  const groups = Object.entries(MUSCLE_TAXONOMY)
    .filter(([group, details]) => group === normalized || details.includes(normalized))
    .map(([group]) => group);
  return [...new Set(groups)];
};

export const getRelatedMuscleNames = (muscle = "") => {
  const normalized = normalizeMuscleName(muscle);
  if (Object.keys(MUSCLE_TAXONOMY).includes(normalized)) {
    return [normalized, ...(MUSCLE_TAXONOMY[normalized] || [])];
  }
  const groups = getBroadGroupsForMuscle(normalized);
  return [...new Set([muscle, normalized])].filter(Boolean);
};
