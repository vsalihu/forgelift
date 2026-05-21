const lowerBodyNames = ["Squat", "Deadlift", "Romanian Deadlift", "Hip Thrust", "Leg Press"];
const upperCompoundNames = ["Bench Press", "Overhead Press", "Barbell Row"];

const roundOne = (value) => Math.round((value || 0) * 10) / 10;

const getIncrement = (exercise) => {
  if (exercise?.overloadIncrementKg !== undefined && exercise.overloadIncrementKg !== null) {
    return Number(exercise.overloadIncrementKg) || 0;
  }

  if (lowerBodyNames.includes(exercise?.name)) return 5;
  if (upperCompoundNames.includes(exercise?.name)) return 2.5;
  if (exercise?.exerciseType === "isolation") return 1;
  if (exercise?.exerciseType === "machine") return 2.5;
  if (exercise?.exerciseType === "bodyweight") return 0;
  return 2.5;
};

const getWorkingSets = (sets = []) => {
  const completedSets = sets.filter((set) => set.completed !== false);
  const heaviest = Math.max(...completedSets.map((set) => set.weight || 0), 0);
  const threshold = heaviest * 0.6;
  return completedSets.filter((set) => (set.weight || 0) >= threshold);
};

const getTopWeightSets = (sets = []) => {
  const workingSets = getWorkingSets(sets);
  const topWeight = Math.max(...workingSets.map((set) => set.weight || 0), 0);
  return {
    workingSets,
    topWeight,
    topSets: workingSets.filter((set) => (set.weight || 0) === topWeight)
  };
};

const average = (values = []) => {
  const realValues = values.filter((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)));
  if (!realValues.length) return 0;
  return realValues.reduce((total, value) => total + Number(value), 0) / realValues.length;
};

const hasRepDrop = (sets = []) => {
  for (let index = 1; index < sets.length; index += 1) {
    if ((sets[index - 1].reps || 0) - (sets[index].reps || 0) >= 2) return true;
  }
  return false;
};

const getConfidence = ({ previousWorkoutExercises, recoveryScores, workingSets }) => {
  const hasRpe = workingSets.some((set) => set.rpe);
  const hasRecovery = recoveryScores.length > 0;

  if (previousWorkoutExercises.length >= 2 && hasRecovery && hasRpe) return "High";
  if (previousWorkoutExercises.length >= 1 && (hasRecovery || hasRpe)) return "Medium";
  return "Low";
};

const getExerciseMuscles = (exercise, latestWorkoutExercise) => {
  const impactMuscles = Object.keys(exercise?.impactProfile || latestWorkoutExercise?.impactProfile || {});
  return [
    ...(exercise?.primaryMuscles || latestWorkoutExercise?.primaryMuscles || []),
    ...(exercise?.secondaryMuscles || latestWorkoutExercise?.secondaryMuscles || []),
    ...impactMuscles
  ].filter((muscle, index, list) => muscle && list.indexOf(muscle) === index);
};

const getRecoveryContext = ({ muscles, recoveryScores }) => {
  const relevantScores = recoveryScores.filter((score) => muscles.includes(score.muscleGroup));
  const primaryLow = relevantScores.filter((score) => score.score < 60);
  const secondaryLow = relevantScores.filter((score) => score.score < 50);

  if (primaryLow.length) {
    return {
      blocksIncrease: true,
      warning: `${primaryLow.map((score) => score.muscleGroup).join(", ")} recovery is below 60%.`,
      context: `${primaryLow[0].muscleGroup} is not recovered enough for aggressive overload.`
    };
  }

  if (secondaryLow.length) {
    return {
      blocksIncrease: false,
      warning: `${secondaryLow.map((score) => score.muscleGroup).join(", ")} recovery is low and may limit performance.`,
      context: `${secondaryLow[0].muscleGroup} is still recovering from related work.`
    };
  }

  return {
    blocksIncrease: false,
    warning: "",
    context: relevantScores.length ? "Relevant muscles are recovered enough for normal progression." : "No recovery data yet."
  };
};

const getPlateauState = (previousWorkoutExercises, latestWorkoutExercise) => {
  const sessions = [latestWorkoutExercise, ...previousWorkoutExercises].slice(0, 4);
  if (sessions.length < 3) return { plateau: false, deloadFlag: false };

  const latest = sessions[0];
  const previousThree = sessions.slice(1, 3);
  const previousFour = sessions.slice(1, 4);
  const previousBest1RM = Math.max(...previousThree.map((session) => session.exerciseBestEstimated1RM || 0), 0);
  const previousBestVolume = Math.max(...previousThree.map((session) => session.exerciseTotalVolume || 0), 0);
  const previousBest1RM4 = Math.max(...previousFour.map((session) => session.exerciseBestEstimated1RM || 0), 0);
  const noImprovement3 = (latest.exerciseBestEstimated1RM || 0) <= previousBest1RM;
  const noVolume3 = (latest.exerciseTotalVolume || 0) <= previousBestVolume;
  const noImprovement4 = sessions.length >= 4 && (latest.exerciseBestEstimated1RM || 0) <= previousBest1RM4;
  const highRpeRepeated = sessions.filter((session) => (session.exerciseAverageRPE || 0) >= 9).length >= 3;

  return {
    plateau: noImprovement3 && noVolume3,
    deloadFlag: noImprovement4 && highRpeRepeated
  };
};

const getGoalPathContext = ({ user, exercise, muscles, weakPoints, trainingBalance }) => {
  const goalPath = user?.goalPath || "Balanced Beast";
  const weakMuscles = weakPoints
    .filter((weakPoint) => muscles.includes(weakPoint.muscleGroup))
    .map((weakPoint) => weakPoint.muscleGroup);

  if (goalPath === "Strength Warrior") return "Strength Warrior favors weight progression when recovery and set quality support it.";
  if (goalPath === "Muscle Builder") return "Muscle Builder favors rep quality and volume before aggressive weight jumps.";
  if (goalPath === "Fat Loss Fighter") return "Fat Loss Fighter prioritizes repeatable performance and consistency.";
  if (goalPath === "Beginner Foundation") return "Beginner Foundation uses conservative increases and clean completion first.";
  if (goalPath === "Athletic Performance") return "Athletic Performance avoids overload when balance or recovery is poor.";
  if (goalPath === "Glute Growth" && muscles.some((muscle) => ["Glutes", "Hamstrings", "Legs"].includes(muscle))) {
    return `${exercise.name} supports lower-body and glute-focused progression.`;
  }
  if (goalPath === "Balanced Beast" && trainingBalance?.score < 70) {
    return "Balanced Beast is sensitive to current training imbalance.";
  }
  if (weakMuscles.length) return `This exercise supports current weak point work for ${weakMuscles.join(", ")}.`;
  return "Balanced progression is recommended.";
};

const getWeakPointContext = ({ muscles, weakPoints, exercise, trainingBalance }) => {
  const matching = weakPoints.filter((weakPoint) => muscles.includes(weakPoint.muscleGroup));

  if (matching.length) {
    return `This exercise supports your current weak point: ${matching[0].muscleGroup}.`;
  }

  if (trainingBalance?.pushPullRatio > 1.6 && ["Bench Press", "Incline Dumbbell Press", "Overhead Press"].includes(exercise.name)) {
    return "Push volume is already high. Do not aggressively overload pressing until pull volume improves.";
  }

  if (trainingBalance?.pushPullRatio > 1.6 && ["Barbell Row", "Lat Pulldown", "Pull-up"].includes(exercise.name)) {
    return "This supports your pull volume imbalance. Prioritize controlled progression.";
  }

  return "";
};

export const generateOverloadRecommendation = ({
  user,
  exercise,
  latestWorkoutExercise,
  previousWorkoutExercises = [],
  recoveryScores = [],
  weakPoints = [],
  trainingBalance
}) => {
  const exerciseName = exercise?.name || latestWorkoutExercise.exerciseName;
  const repMin = exercise?.defaultRepMin || 6;
  const repMax = exercise?.defaultRepMax || 10;
  const increment = getIncrement(exercise || { name: exerciseName, exerciseType: "compound" });
  const { workingSets, topWeight, topSets } = getTopWeightSets(latestWorkoutExercise.sets || []);
  const isBodyweightExercise = exercise?.exerciseType === "bodyweight" || latestWorkoutExercise.exerciseType === "bodyweight";
  const hasAddedLoad = workingSets.some((set) => Number(set.addedLoad) > 0);
  const failedSets = (latestWorkoutExercise.sets || []).filter((set) => set.completed === false);
  const averageRPE = average(topSets.map((set) => set.rpe));
  const currentRepTarget = `${repMin}-${repMax} reps`;
  const muscles = getExerciseMuscles(exercise, latestWorkoutExercise);
  const recovery = getRecoveryContext({ muscles, recoveryScores });
  const plateauState = getPlateauState(previousWorkoutExercises, latestWorkoutExercise);
  const confidence = getConfidence({ previousWorkoutExercises, recoveryScores, workingSets });
  const goalPathContext = getGoalPathContext({ user, exercise: exercise || { name: exerciseName }, muscles, weakPoints, trainingBalance });
  const weakPointContext = getWeakPointContext({ muscles, weakPoints, exercise: exercise || { name: exerciseName }, trainingBalance });
  const warnings = [];
  const detailedReasons = [];
  let recommendationType = "repeat_weight";
  let recommendedWeight = topWeight;
  let recommendedRepTarget = `${topSets.length || 3} sets of ${repMin}-${repMax}`;
  let recommendedSets = Math.max(topSets.length, 2);
  let reason = "Repeat this exercise to build a reliable progression baseline.";
  const realSessionCount = previousWorkoutExercises.length + 1;
  const dataStatus = realSessionCount >= 3 ? "sufficient_history" : "limited_history";

  if (!workingSets.length || topWeight === 0) {
    recommendationType = "increase_reps";
    recommendedWeight = topWeight;
    recommendedRepTarget = `Add reps within ${repMin}-${repMax} before adding load`;
    reason = "Build reps and control first before increasing load.";
  } else if (isBodyweightExercise) {
    recommendationType = "increase_reps";
    recommendedWeight = topWeight;
    recommendedRepTarget = hasAddedLoad
      ? `Keep total load and add reps before increasing added load`
      : `Add reps within ${repMin}-${repMax} before adding external load`;
    reason = hasAddedLoad
      ? "For weighted bodyweight work, progress reps first and increase added load gradually."
      : "For bodyweight work, build reps and control before adding external load.";
  } else if (previousWorkoutExercises.length === 0) {
    recommendationType = "repeat_weight";
    reason = `Build baseline. Repeat ${topWeight}kg and improve control or reps before increasing.`;
  }

  if (recovery.warning) warnings.push(recovery.warning);

  const allAtTop = topSets.length >= 2 && topSets.every((set) => (set.reps || 0) >= repMax);
  const hasTopSetRPE = topSets.some((set) => set.rpe);
  const mostInsideRange = topSets.filter((set) => (set.reps || 0) >= repMin && (set.reps || 0) <= repMax).length >= Math.ceil(topSets.length * 0.6);
  const mostBelowMin = topSets.filter((set) => (set.reps || 0) < repMin).length >= Math.ceil(topSets.length * 0.5);
  const repeatedFailure = failedSets.length >= 2;
  const repDrop = hasRepDrop(topSets);
  const conservativeMode = user?.overloadMode === "Conservative" || user?.goalPath === "Beginner Foundation";
  const aggressiveMode = user?.overloadMode === "Aggressive";
  const rpeIncreaseLimit = aggressiveMode ? 8.5 : 8;
  const recoveryBlocksIncrease = recovery.blocksIncrease || (aggressiveMode ? false : recovery.warning && recoveryScores.some((score) => muscles.includes(score.muscleGroup) && score.score < 60));

  if (plateauState.deloadFlag) {
    recommendationType = "deload_flag";
    recommendedWeight = roundOne(topWeight * 0.9);
    recommendedRepTarget = `${repMin}-${Math.max(repMin, repMax - 2)} easy reps`;
    reason = "Possible deload needed. Full deload recommendation will be handled by the Deload system.";
    warnings.push("Repeated high-RPE sessions with no improvement detected.");
  } else if (plateauState.plateau) {
    recommendationType = "plateau_warning";
    recommendedWeight = topWeight;
    reason = "Last 3 sessions show no estimated 1RM or volume improvement.";
    warnings.push("A plateau may be forming.");
  } else if (recoveryBlocksIncrease) {
    recommendationType = "recovery_warning";
    recommendedWeight = topWeight;
    reason = "Do not increase load yet because relevant muscle recovery is low.";
  } else if (repeatedFailure || averageRPE >= 9.5 || mostBelowMin) {
    recommendationType = "reduce_weight";
    recommendedWeight = roundOne(topWeight * 0.95);
    recommendedRepTarget = `${repMin}-${repMax} cleaner reps`;
    reason = "Reduce weight slightly because set quality or RPE indicates the current load is too heavy.";
  } else if (isBodyweightExercise && allAtTop && (!hasTopSetRPE || averageRPE <= rpeIncreaseLimit)) {
    recommendationType = hasAddedLoad ? "increase_reps" : "increase_reps";
    recommendedWeight = topWeight;
    recommendedRepTarget = hasAddedLoad
      ? `Add 1 rep per set or add 2.5kg only if form stays strong`
      : `Aim for ${repMax + 1} reps per set or consider +2.5kg added load`;
    reason = hasAddedLoad
      ? "You are ready to progress weighted bodyweight work conservatively. Add reps first, then increase external load in small jumps."
      : "You completed the top of the rep range. Add reps first, or add a small external load if form is strong.";
  } else if (!isBodyweightExercise && realSessionCount >= 3 && allAtTop && hasTopSetRPE && averageRPE <= rpeIncreaseLimit && !conservativeMode) {
    recommendationType = "increase_weight";
    recommendedWeight = roundOne(topWeight + increment);
    recommendedRepTarget = user?.goalPath === "Strength Warrior" ? `${repMin}-${Math.max(repMin, repMax - 2)} reps` : `${repMin}-${repMax} reps`;
    reason = `Increase to ${recommendedWeight}kg next time. You completed all target sets at the top of the rep range with controlled difficulty.`;
  } else if (allAtTop && conservativeMode) {
    recommendationType = "repeat_weight";
    recommendedWeight = topWeight;
    reason = "Repeat the same weight once more before increasing because your overload mode is conservative.";
  } else if (allAtTop && !hasTopSetRPE) {
    recommendationType = "repeat_weight";
    recommendedWeight = topWeight;
    reason = "Repeat the same weight with RPE logged before increasing so ForgeLift can judge difficulty.";
  } else if (mostInsideRange && averageRPE <= 9) {
    recommendationType = user?.goalPath === "Muscle Builder" ? "increase_reps" : "repeat_weight";
    recommendedWeight = topWeight;
    recommendedRepTarget = `${topSets.length || 3} sets aiming for ${repMax} reps`;
    reason = `Stay at ${topWeight}kg and aim to bring all working sets to ${repMax} reps.`;
  } else if (repDrop || failedSets.length || averageRPE >= 9) {
    recommendationType = "repeat_weight";
    recommendedWeight = topWeight;
    reason = "Repeat the same load and improve set completion before increasing.";
  }

  if (trainingBalance?.pushPullRatio > 1.6 && ["Bench Press", "Incline Dumbbell Press", "Overhead Press"].includes(exerciseName)) {
    warnings.push("Push volume is already high compared with pull volume.");
    if (recommendationType === "increase_weight") {
      recommendationType = "repeat_weight";
      recommendedWeight = topWeight;
      reason = "Repeat pressing load because push volume is already ahead of pull volume.";
    }
  }

  if (weakPointContext) detailedReasons.push(weakPointContext);
  if (goalPathContext) detailedReasons.push(goalPathContext);
  if (isBodyweightExercise) {
    detailedReasons.push(
      hasAddedLoad
        ? "Bodyweight exercise detected. ForgeLift treats the logged weight as bodyweight plus added load."
        : "Bodyweight exercise detected. ForgeLift prioritizes reps and control before external load."
    );
  }
  detailedReasons.push(`Top working weight was ${topWeight}kg with average RPE ${roundOne(averageRPE) || "not logged"}.`);
  detailedReasons.push(recovery.context);
  if (realSessionCount < 3) {
    detailedReasons.unshift(`Only ${realSessionCount} logged session${realSessionCount === 1 ? "" : "s"} exists for this exercise. Confidence is limited.`);
    if (recommendationType === "increase_weight") {
      recommendationType = "repeat_weight";
      recommendedWeight = topWeight;
      reason = "Repeat this load to establish a reliable history before increasing.";
    }
  }

  return {
    exerciseId: exercise?._id || latestWorkoutExercise.exerciseId,
    exerciseName,
    muscleGroups: muscles,
    recommendationType,
    currentWeight: topWeight,
    recommendedWeight,
    currentRepTarget,
    recommendedRepTarget,
    recommendedSets,
    confidence,
    reason,
    detailedReasons,
    warnings: warnings.filter(Boolean),
    goalPathContext,
    recoveryContext: recovery.context,
    weakPointContext,
    dataStatus,
    isEstimate: false
  };
};
