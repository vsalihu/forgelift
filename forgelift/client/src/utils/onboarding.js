export const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "custom", label: "Custom" }
];

export const strengthStandardOptions = [
  { value: "male", label: "Male standard" },
  { value: "female", label: "Female standard" },
  { value: "neutral", label: "Neutral standard" }
];

export const goalPaths = [
  {
    name: "Strength Warrior",
    description: "Focuses on heavier compound lifts, estimated 1RM, and strength progress."
  },
  {
    name: "Muscle Builder",
    description: "Focuses on hypertrophy, weekly volume, and muscle growth."
  },
  {
    name: "Fat Loss Fighter",
    description: "Focuses on consistency, workout frequency, and conditioning."
  },
  {
    name: "Athletic Performance",
    description: "Focuses on balanced strength, endurance, mobility, and recovery."
  },
  {
    name: "Beginner Foundation",
    description: "Focuses on safe progression, technique, and consistency."
  },
  {
    name: "Balanced Beast",
    description: "Focuses on even development across all muscle groups."
  },
  {
    name: "Glute Growth",
    description: "Focuses on glutes, hamstrings, legs, and lower-body progression."
  }
];

export const getDefaultStrengthStandard = (gender) => {
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "neutral";
};

export const getSuggestedMeasurements = (gender) => {
  const fields = {
    male: ["chest", "waist", "shoulders", "arms", "thighs", "calves"],
    female: ["waist", "hips", "glutes", "thighs", "shoulders", "arms", "chest"],
    prefer_not_to_say: ["chest", "waist", "hips", "shoulders", "arms", "thighs"],
    custom: ["chest", "waist", "hips", "shoulders", "arms", "thighs", "glutes"]
  };

  return fields[gender] || fields.prefer_not_to_say;
};
