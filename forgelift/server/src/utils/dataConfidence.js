export const getDataConfidence = ({
  relevantWorkoutCount = 0,
  relevantExerciseSessionCount = 0,
  hasStrengthBaseline = false,
  hasRecentData = false,
  requiredMinimum = 3
} = {}) => {
  const realCount = Math.max(Number(relevantWorkoutCount) || 0, Number(relevantExerciseSessionCount) || 0);

  if (realCount === 0 && !hasStrengthBaseline) {
    return {
      level: "none",
      canGenerateRecommendation: false,
      reason: "No relevant logged training data is available yet.",
      missingDataMessage: `Log at least ${requiredMinimum} relevant session${requiredMinimum === 1 ? "" : "s"} to unlock this recommendation.`
    };
  }

  if (realCount === 0 && hasStrengthBaseline) {
    return {
      level: "low",
      canGenerateRecommendation: false,
      reason: "Only a strength baseline is available.",
      missingDataMessage: "This can support a starting estimate, but real workout history is needed for recommendations."
    };
  }

  if (realCount === 1) {
    return {
      level: "low",
      canGenerateRecommendation: false,
      reason: "Only one relevant logged session is available.",
      missingDataMessage: `Log ${Math.max(requiredMinimum - 1, 1)} more relevant sessions to improve confidence.`
    };
  }

  if (realCount < requiredMinimum) {
    return {
      level: "medium",
      canGenerateRecommendation: true,
      reason: "Some relevant logged data is available, but confidence is still limited.",
      missingDataMessage: `Log ${requiredMinimum - realCount} more relevant session${requiredMinimum - realCount === 1 ? "" : "s"} for high confidence.`
    };
  }

  return {
    level: hasRecentData ? "high" : "medium",
    canGenerateRecommendation: true,
    reason: hasRecentData ? "Enough recent logged training data is available." : "Enough logged data exists, but recent data is limited.",
    missingDataMessage: hasRecentData ? "" : "Log a recent session to refresh this recommendation."
  };
};
