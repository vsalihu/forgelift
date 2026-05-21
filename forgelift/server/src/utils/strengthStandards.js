const rankTargets = {
  male: {
    "Bench Press": [0.3, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25],
    Squat: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5],
    Deadlift: [0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3]
  },
  female: {
    "Bench Press": [0.2, 0.35, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7],
    Squat: [0.35, 0.55, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25],
    Deadlift: [0.45, 0.7, 0.95, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7]
  }
};

const averageTargets = (maleTargets, femaleTargets) =>
  maleTargets.map((target, index) => Math.round(((target + femaleTargets[index]) / 2) * 100) / 100);

export const STRENGTH_STANDARDS = {
  ...rankTargets,
  neutral: {
    "Bench Press": averageTargets(rankTargets.male["Bench Press"], rankTargets.female["Bench Press"]),
    Squat: averageTargets(rankTargets.male.Squat, rankTargets.female.Squat),
    Deadlift: averageTargets(rankTargets.male.Deadlift, rankTargets.female.Deadlift)
  }
};

export const getStrengthStandardTargets = (selectedStrengthStandard = "neutral", exerciseName) => {
  const standard = STRENGTH_STANDARDS[selectedStrengthStandard] || STRENGTH_STANDARDS.neutral;
  return standard[exerciseName] || null;
};

export const getBodyweightKg = (user) => {
  const bodyweight = Number(user?.bodyweight) || 0;

  if (!bodyweight) return 0;
  if (user?.preferredUnits === "imperial") return bodyweight * 0.453592;
  return bodyweight;
};
