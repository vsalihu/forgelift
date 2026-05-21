import { TRAINING_CATEGORIES } from "./trainingCategories.js";

const roundOne = (value) => Math.round((value || 0) * 10) / 10;

const safeRatio = (numerator, denominator) => {
  if (!denominator && !numerator) return 1;
  if (!denominator) return 99;
  return roundOne(numerator / denominator);
};

const weightedLoad = (load = {}) =>
  (load.directLoad || 0) + (load.indirectLoad || 0) * 0.5 + (load.stabiliserLoad || 0) * 0.25;

const scoreRatio = ({ ratio, idealMin, idealMax, mildLow, mildHigh, severeLow, severeHigh, mildPenalty, mediumPenalty, severePenalty }) => {
  if (ratio >= idealMin && ratio <= idealMax) return 0;
  if ((ratio >= mildLow && ratio < idealMin) || (ratio > idealMax && ratio <= mildHigh)) return mildPenalty;
  if ((ratio >= severeLow && ratio < mildLow) || (ratio > mildHigh && ratio <= severeHigh)) return mediumPenalty;
  return severePenalty;
};

const getStatus = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
};

const getDirectTrainingDates = (workouts, muscle) => {
  return workouts
    .filter((workout) => (workout.muscleLoadSummary?.[muscle]?.directLoad || 0) > 0)
    .map((workout) => workout.date);
};

export const calculateTrainingBalance = ({ user, workouts = [], muscleRanks = [] }) => {
  const now = new Date();
  const calculatedFrom = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const muscleTotals = {};
  let totalDirectLoad = 0;
  let totalIndirectLoad = 0;
  let score = 100;
  const warnings = [];
  const recommendations = [];

  if (!workouts.length) {
    return {
      score: null,
      status: "Not enough data",
      confidence: "none",
      dataStatus: "no_data",
      minimumDataMet: false,
      pushPullRatio: 1,
      upperLowerRatio: 1,
      frontRearRatio: 1,
      directIndirectRatio: 1,
      coreFrequencyScore: 0,
      gluteHamstringScore: 0,
      weakestAreas: [],
      strongestAreas: [],
      warnings: ["Log workouts across different muscle groups before ForgeLift can calculate training balance."],
      recommendations: ["Start with one push, one pull, and one lower-body workout."],
      calculatedFrom,
      calculatedTo: now,
      volumeBreakdown: { muscleTotals: {} }
    };
  }

  workouts.forEach((workout) => {
    Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
      muscleTotals[muscle] = muscleTotals[muscle] || {
        directLoad: 0,
        indirectLoad: 0,
        stabiliserLoad: 0,
        weightedLoad: 0
      };

      muscleTotals[muscle].directLoad += load.directLoad || 0;
      muscleTotals[muscle].indirectLoad += load.indirectLoad || 0;
      muscleTotals[muscle].stabiliserLoad += load.stabiliserLoad || 0;
      muscleTotals[muscle].weightedLoad += weightedLoad(load);
      totalDirectLoad += load.directLoad || 0;
      totalIndirectLoad += load.indirectLoad || 0;
    });
  });

  const categoryLoad = (category) =>
    Object.entries(muscleTotals).reduce(
      (total, [muscle, load]) => (TRAINING_CATEGORIES[category].includes(muscle) ? total + load.weightedLoad : total),
      0
    );

  const pushVolume = categoryLoad("push");
  const pullVolume = categoryLoad("pull");
  const upperVolume = categoryLoad("upper");
  const lowerVolume = categoryLoad("lower");
  const frontVolume = categoryLoad("front");
  const rearVolume = categoryLoad("rear");
  const gluteHamstringDirect = TRAINING_CATEGORIES.gluteHamstring.reduce(
    (total, muscle) => total + (muscleTotals[muscle]?.directLoad || 0),
    0
  );
  const legDirect = muscleTotals.Legs?.directLoad || 0;
  const pushPullRatio = safeRatio(pushVolume, pullVolume);
  const upperLowerRatio = safeRatio(upperVolume, lowerVolume);
  const frontRearRatio = safeRatio(frontVolume, rearVolume);
  const directIndirectRatio = safeRatio(totalDirectLoad, totalIndirectLoad);
  const trainedMuscleCount = Object.keys(muscleTotals).filter((muscle) => muscleTotals[muscle].weightedLoad > 0).length;
  const minimumDataMet = workouts.length >= 3 && trainedMuscleCount >= 2;

  if (!minimumDataMet) {
    return {
      score: null,
      status: "Not enough data",
      confidence: workouts.length === 1 ? "low" : "medium",
      dataStatus: "limited_history",
      minimumDataMet: false,
      pushPullRatio,
      upperLowerRatio,
      frontRearRatio,
      directIndirectRatio,
      coreFrequencyScore: 0,
      gluteHamstringScore: 0,
      weakestAreas: [],
      strongestAreas: Object.keys(muscleTotals),
      warnings: ["Training balance is based on limited data."],
      recommendations: ["Log at least 3 workouts across 2 or more muscle groups for a meaningful balance score."],
      calculatedFrom,
      calculatedTo: now,
      volumeBreakdown: {
        pushVolume: roundOne(pushVolume),
        pullVolume: roundOne(pullVolume),
        upperVolume: roundOne(upperVolume),
        lowerVolume: roundOne(lowerVolume),
        frontVolume: roundOne(frontVolume),
        rearVolume: roundOne(rearVolume),
        totalDirectLoad: roundOne(totalDirectLoad),
        totalIndirectLoad: roundOne(totalIndirectLoad),
        muscleTotals
      }
    };
  }

  const pushPenalty = scoreRatio({
    ratio: pushPullRatio,
    idealMin: 0.8,
    idealMax: 1.25,
    mildLow: 0.6,
    mildHigh: 1.6,
    severeLow: 0.4,
    severeHigh: 2.2,
    mildPenalty: 10,
    mediumPenalty: 20,
    severePenalty: 30
  });
  score -= pushPenalty;
  if (pushPullRatio > 1.25) warnings.push(`Push volume is ${pushPullRatio}x higher than pull volume.`);
  if (pushPullRatio < 0.8) warnings.push(`Pull volume is stronger than push volume with a ${pushPullRatio}x push/pull ratio.`);
  if (pushPenalty) recommendations.push("Balance pressing with rows, pulldowns, and rear delt work.");

  const upperPenalty = scoreRatio({
    ratio: upperLowerRatio,
    idealMin: 0.8,
    idealMax: 1.4,
    mildLow: 0.5,
    mildHigh: 2,
    severeLow: 0,
    severeHigh: 2,
    mildPenalty: 10,
    mediumPenalty: 25,
    severePenalty: 25
  });
  score -= upperPenalty;
  if (upperLowerRatio > 1.4) warnings.push(`Upper body volume is ${upperLowerRatio}x lower-body volume.`);
  if (upperLowerRatio < 0.8) warnings.push(`Lower body volume is ahead of upper body with a ${upperLowerRatio}x upper/lower ratio.`);
  if (upperPenalty) recommendations.push("Add the undertrained half of the body to the next training week.");

  const frontPenalty = scoreRatio({
    ratio: frontRearRatio,
    idealMin: 0.8,
    idealMax: 1.3,
    mildLow: 0.6,
    mildHigh: 1.8,
    severeLow: 0,
    severeHigh: 1.8,
    mildPenalty: 10,
    mediumPenalty: 20,
    severePenalty: 20
  });
  score -= frontPenalty;
  if (frontRearRatio > 1.3) warnings.push(`Front-chain training is ${frontRearRatio}x rear-chain training.`);
  if (frontRearRatio < 0.8) warnings.push(`Rear-chain work is dominating front-chain work.`);
  if (frontPenalty) recommendations.push("Balance front-chain work with back, hamstring, glute, and rear delt work.");

  const coreDates = getDirectTrainingDates(workouts, "Core");
  const coreLast14 = coreDates.some((date) => new Date(date) >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
  const coreLast28 = coreDates.length > 0;
  let coreFrequencyScore = 100;
  if (!coreLast28) {
    score -= 15;
    coreFrequencyScore = 0;
    warnings.push("No direct core work detected in the last 28 days.");
    recommendations.push("Add direct core work this week.");
  } else if (!coreLast14) {
    score -= 10;
    coreFrequencyScore = 50;
    warnings.push("No direct core work detected in the last 14 days.");
  }

  let gluteHamstringScore = 100;
  if (legDirect > 500 && gluteHamstringDirect < legDirect * 0.2) {
    score -= 10;
    gluteHamstringScore = 50;
    warnings.push("Legs are trained, but direct glute and hamstring work is low.");
    recommendations.push("Add hip thrusts, Romanian deadlifts, or hamstring curls.");
  }

  const indirectOnlyMuscles = Object.entries(muscleTotals)
    .filter(([, load]) => load.indirectLoad > 500 && load.directLoad < load.indirectLoad * 0.25)
    .map(([muscle]) => muscle);
  if (indirectOnlyMuscles.length) {
    score -= 10;
    warnings.push(`${indirectOnlyMuscles.slice(0, 3).join(", ")} receive mostly indirect work.`);
    recommendations.push("Add direct work for muscles that are mostly loaded indirectly.");
  }

  const sortedAreas = Object.entries(muscleTotals)
    .map(([muscle, load]) => ({ muscle, load: load.weightedLoad }))
    .sort((a, b) => b.load - a.load);
  const strongestAreas = sortedAreas.slice(0, 4).map((item) => item.muscle);
  const weakestAreas = sortedAreas.filter((item) => item.load > 0).slice(-4).map((item) => item.muscle);

  if (user?.goalPath === "Glute Growth" && (muscleTotals.Glutes?.directLoad || 0) < 500) {
    score -= 10;
    warnings.push("Glute Growth goal selected, but direct glute load is low.");
    recommendations.push("Prioritize hip thrusts, squats, and Romanian deadlifts.");
  }

  if (user?.goalPath === "Fat Loss Fighter") {
    const last7 = workouts.filter((workout) => new Date(workout.date) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    if (last7.length < 3) {
      score -= 10;
      warnings.push("Fat Loss Fighter goal benefits from at least 3 sessions per week.");
    }
  }

  if (user?.goalPath === "Balanced Beast" && warnings.length) {
    score -= 5;
    recommendations.push("Balanced Beast scoring is stricter: keep major muscle groups even.");
  }

  if (user?.goalPath === "Beginner Foundation") {
    const highRpeCount = workouts.filter((workout) => (workout.averageRPE || workout.sessionRPE || 0) >= 9).length;
    if (highRpeCount >= 2) {
      score -= 10;
      warnings.push("Several recent sessions were very high RPE for Beginner Foundation.");
      recommendations.push("Use more moderate sets while building consistency.");
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    status: finalScore >= 85 ? "Excellent" : finalScore >= 70 ? "Good" : finalScore >= 50 ? "Needs Work" : "Poor",
    confidence: "high",
    dataStatus: "sufficient_history",
    minimumDataMet: true,
    pushPullRatio,
    upperLowerRatio,
    frontRearRatio,
    directIndirectRatio,
    coreFrequencyScore,
    gluteHamstringScore,
    weakestAreas,
    strongestAreas,
    warnings,
    recommendations,
    calculatedFrom,
    calculatedTo: now,
    volumeBreakdown: {
      pushVolume: roundOne(pushVolume),
      pullVolume: roundOne(pullVolume),
      upperVolume: roundOne(upperVolume),
      lowerVolume: roundOne(lowerVolume),
      frontVolume: roundOne(frontVolume),
      rearVolume: roundOne(rearVolume),
      totalDirectLoad: roundOne(totalDirectLoad),
      totalIndirectLoad: roundOne(totalIndirectLoad),
      muscleTotals
    }
  };
};
