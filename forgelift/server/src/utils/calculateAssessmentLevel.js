import { getBodyweightKg, getStrengthStandardTargets } from "./strengthStandards.js";

export const trainingHistoryMap = {
  new: { points: 0, months: 0, label: "No, I am new" },
  less_than_6_months: { points: 10, months: 3, label: "Yes, less than 6 months" },
  six_to_eighteen_months: { points: 25, months: 12, label: "Yes, 6 to 18 months" },
  eighteen_months_to_three_years: { points: 40, months: 30, label: "Yes, 18 months to 3 years" },
  three_plus_years: { points: 55, months: 48, label: "Yes, 3+ years" }
};

export const weeklyFrequencyMap = {
  "0": { points: 0, days: 0 },
  "1_to_2": { points: 5, days: 2 },
  "3_to_4": { points: 15, days: 4 },
  "5_plus": { points: 20, days: 5 }
};

const gymConfidenceMap = {
  not_confident: 0,
  somewhat_confident: 5,
  confident: 10,
  very_confident: 15
};

const standardPointScale = [5, 10, 20, 35, 45, 50, 55, 60, 65];

const fallbackRatioPoints = (ratio) => {
  if (ratio >= 1.75) return 50;
  if (ratio >= 1.25) return 35;
  if (ratio >= 0.85) return 20;
  if (ratio >= 0.5) return 10;
  if (ratio > 0) return 5;
  return 0;
};

const getStrengthPoints = ({ lift, user, bodyweight }) => {
  if (!bodyweight || !lift.estimatedOneRepMax) return 0;

  const ratio = Number(lift.estimatedOneRepMax) / bodyweight;
  const targets = getStrengthStandardTargets(user?.selectedStrengthStandard || "neutral", lift.exerciseName);

  if (!targets) return fallbackRatioPoints(ratio);

  let bestIndex = -1;
  targets.forEach((target, index) => {
    if (ratio >= target) bestIndex = index;
  });

  return bestIndex >= 0 ? standardPointScale[bestIndex] : ratio > 0 ? 3 : 0;
};

const getLevelFromScore = ({ score, enteredLiftCount }) => {
  if (score >= 80 && enteredLiftCount >= 3) return "Advanced";
  if (score >= 40) return "Intermediate";
  return "Beginner";
};

const getConfidence = ({ enteredLiftCount, bodyweight, trainingHistory }) => {
  if (enteredLiftCount >= 3 && bodyweight && trainingHistory) return "High";
  if (enteredLiftCount >= 1 && trainingHistory) return "Medium";
  return "Low";
};

export const calculateAssessmentLevel = ({ user, answers = {}, enteredLifts = [] }) => {
  const trainingHistory = answers.trainingHistory || "new";
  const weeklyFrequency = answers.weeklyFrequency || "0";
  const gymConfidence = answers.gymConfidence || "not_confident";
  const bodyweight = getBodyweightKg(user);

  const history = trainingHistoryMap[trainingHistory] || trainingHistoryMap.new;
  const frequency = weeklyFrequencyMap[weeklyFrequency] || weeklyFrequencyMap["0"];
  const confidencePoints = gymConfidenceMap[gymConfidence] || 0;
  const strengthScores = enteredLifts.map((lift) => ({
    exerciseName: lift.exerciseName,
    points: getStrengthPoints({ lift, user, bodyweight }),
    estimatedOneRepMax: Number(lift.estimatedOneRepMax) || 0
  }));
  const averageStrengthScore = strengthScores.length
    ? Math.round(strengthScores.reduce((sum, lift) => sum + lift.points, 0) / strengthScores.length)
    : 0;
  const score = history.points + frequency.points + confidencePoints + averageStrengthScore;
  const calculatedLevel = getLevelFromScore({ score, enteredLiftCount: enteredLifts.length });
  const confidence = getConfidence({ enteredLiftCount: enteredLifts.length, bodyweight, trainingHistory });
  const strongest = [...strengthScores].sort((a, b) => b.points - a.points || b.estimatedOneRepMax - a.estimatedOneRepMax)[0];
  const weakest = [...strengthScores].sort((a, b) => a.points - b.points || a.estimatedOneRepMax - b.estimatedOneRepMax)[0];
  const reasons = [
    `${history.label} added ${history.points} background points.`,
    `${frequency.days} training days per week added ${frequency.points} frequency points.`
  ];

  if (enteredLifts.length) {
    reasons.push(`${enteredLifts.length} lift baseline${enteredLifts.length === 1 ? "" : "s"} improved scoring confidence.`);
  } else {
    reasons.push("No lift baselines were entered, so ForgeLift kept the level estimate conservative.");
  }

  return {
    calculatedLevel,
    confidence,
    score,
    reasons,
    strongestLift: strongest?.exerciseName || "",
    weakestArea: weakest?.exerciseName || "",
    trainingAgeMonths: history.months,
    weeklyTrainingFrequency: frequency.days
  };
};
