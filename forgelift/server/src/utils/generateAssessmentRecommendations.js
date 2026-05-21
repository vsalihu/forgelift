const levelRecommendations = {
  Beginner: [
    "Start with 2 to 3 workouts per week.",
    "Use RPE 7 to 8 for most working sets.",
    "Focus on learning exercise control before chasing heavy weight.",
    "Use Gym Mode to log your first few sessions so ForgeLift can learn your real level."
  ],
  Intermediate: [
    "Train 3 to 4 times per week with a repeatable plan.",
    "Use Smart Overload to progress only when reps and recovery support it.",
    "Watch recovery and training balance to avoid overusing stronger areas.",
    "Use weak point feedback to decide where extra direct work belongs."
  ],
  Advanced: [
    "Use overload and deload recommendations together.",
    "Track plateaus across major lifts before forcing weight increases.",
    "Prioritise weak points and recovery to avoid stalled progress.",
    "Use monthly reports to plan the next training block."
  ]
};

const goalRecommendations = {
  "Strength Warrior": "Prioritise bench, squat, deadlift, overhead press, and rows.",
  "Muscle Builder": "Focus on weekly volume and direct muscle work.",
  "Fat Loss Fighter": "Focus on consistency and weekly workout frequency.",
  "Athletic Performance": "Keep push, pull, core, and rear-chain work balanced.",
  "Beginner Foundation": "Build consistency first and avoid max-effort sets too early.",
  "Balanced Beast": "Train all major muscle groups and keep push/pull balance close.",
  "Glute Growth": "Prioritise hip thrusts, RDLs, squats, and glute-focused lower body work."
};

export const generateAssessmentRecommendations = ({
  calculatedLevel = "Beginner",
  goalPath = "",
  enteredLifts = [],
  weakestArea = "",
  limitations = [],
  preferredTrainingStyle = ""
}) => {
  const recommendations = [...(levelRecommendations[calculatedLevel] || levelRecommendations.Beginner)];

  if (goalRecommendations[goalPath]) {
    recommendations.push(goalRecommendations[goalPath]);
  }

  if (!enteredLifts.length) {
    recommendations.push("Start by logging your first workouts. ForgeLift will learn your level from real training data.");
  }

  if (weakestArea) {
    recommendations.push(`${weakestArea} looks like the lowest entered lift right now. Treat it as an early focus area.`);
  }

  const meaningfulLimitations = limitations.filter((item) => item && item !== "None");
  if (meaningfulLimitations.length) {
    recommendations.push("Use cautious exercise choices around your selected limitation areas. This is not medical advice.");
  }

  if (preferredTrainingStyle === "Unsure") {
    recommendations.push("If you are unsure, start with balanced full-body sessions and let ForgeLift adapt from your logs.");
  }

  return [...new Set(recommendations)].slice(0, 6);
};
