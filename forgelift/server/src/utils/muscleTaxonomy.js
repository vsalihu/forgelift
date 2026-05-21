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

export const BROAD_MUSCLE_GROUPS = Object.keys(MUSCLE_TAXONOMY);

export const MUSCLE_ALIASES = {
  "front shoulders": "Front Delts",
  "front shoulder": "Front Delts",
  "rear shoulders": "Rear Delts",
  "rear shoulder": "Rear Delts",
  "rear delts": "Rear Delts",
  "rear delt": "Rear Delts",
  "side delts": "Side Delts",
  "side delt": "Side Delts",
  "lateral delts": "Side Delts",
  quadriceps: "Quads",
  quadricep: "Quads",
  quad: "Quads",
  quads: "Quads",
  abdominals: "Abs",
  abdominal: "Abs",
  abs: "Abs",
  bicep: "Biceps",
  "biceps brachii": "Biceps",
  "tricep": "Triceps",
  lats: "Lats",
  lat: "Lats"
};

export const normalizeMuscleName = (muscle = "") => {
  const trimmed = String(muscle).trim();
  if (!trimmed) return "";
  const alias = MUSCLE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  return trimmed.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const getBroadGroupsForMuscle = (muscle = "") => {
  const normalized = normalizeMuscleName(muscle);
  const groups = BROAD_MUSCLE_GROUPS.filter(
    (group) => group === normalized || MUSCLE_TAXONOMY[group].includes(normalized)
  );

  if (["Biceps", "Biceps Long Head", "Biceps Short Head", "Brachialis", "Brachioradialis", "Triceps", "Triceps Long Head", "Triceps Lateral Head", "Triceps Medial Head", "Forearms", "Grip"].includes(normalized)) groups.push("Arms");
  if (["Hamstrings", "Quads", "Calves", "Adductors", "Abductors", "Tibialis"].includes(normalized)) groups.push("Legs");
  if (["Glutes", "Glute Maximus", "Glute Medius", "Glute Minimus", "Abductors"].includes(normalized)) groups.push("Glutes");
  if (normalized === "Shoulders") groups.push("Shoulders");
  if (normalized === "Back") groups.push("Back");
  if (normalized === "Chest") groups.push("Chest");
  if (normalized === "Core") groups.push("Core");

  return [...new Set(groups)];
};

export const getRelatedMuscleNames = (muscle = "") => {
  const normalized = normalizeMuscleName(muscle);
  if (BROAD_MUSCLE_GROUPS.includes(normalized)) {
    return [normalized, ...(MUSCLE_TAXONOMY[normalized] || [])];
  }
  const broadGroups = getBroadGroupsForMuscle(normalized);
  return [...new Set([normalized, muscle])].filter(Boolean);
};
