import { isSetValid, normalizeSetForSave } from "../../utils/workoutSetUtils.js";

export const formatNumber = (value, digits = 1) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value || 0);

export const formatClock = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};

// Keep typed numbers clean: digits and one decimal point, comma accepted as a point.
export const cleanDecimal = (value) => {
  const normalised = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  const [whole, ...rest] = normalised.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

export const cleanInteger = (value) => String(value).replace(/\D/g, "").slice(0, 3);

export const isBodyweightExercise = (exercise) => exercise?.exerciseType === "bodyweight";

// A set counts once it is ticked. Drafts saved before ticking existed have no flag.
export const isLogged = (set) => isSetValid(set) && set.done !== false;

export const exerciseVolume = (exercise) =>
  (exercise.sets || []).filter(isLogged).reduce((total, set) => {
    const normalised = normalizeSetForSave(set);
    return total + (normalised.totalLoad || 0) * (Number(normalised.reps) || 0);
  }, 0);

export const loggedSetCount = (exercise) => (exercise.sets || []).filter(isLogged).length;

// Ghost values for an empty set: the set before it this session, otherwise last session.
export const setPlaceholder = (exercise, setIndex, history) => {
  for (let index = setIndex - 1; index >= 0; index -= 1) {
    const set = exercise.sets[index];
    if (isSetValid(set)) {
      return { weight: String(set.weight ?? ""), addedLoad: String(set.addedLoad ?? ""), reps: String(set.reps ?? "") };
    }
  }
  if (history?.lastReps) {
    return {
      weight: history.lastWeight ? String(history.lastWeight) : "",
      addedLoad: "",
      reps: String(history.lastReps)
    };
  }
  return { weight: "", addedLoad: "", reps: "" };
};

// A suggestion for this exercise: Smart Overload first, then the strength baseline.
export const exerciseSuggestion = (recommendation, baseline) => {
  if (recommendation?.recommendedWeight > 0) {
    // Prefer the explicit rep goal; otherwise the number right before "reps" ("3 sets of 15 reps" means 15, not 3).
    const reps =
      recommendation.recommendationType === "deload_flag" && recommendation.lastReps?.length
        ? String(Math.min(...recommendation.lastReps))
        : ["increase_reps", "repeat_weight"].includes(recommendation.recommendationType) && recommendation.targetReps
        ? String(recommendation.targetReps)
        : String(recommendation.recommendedRepTarget || "").match(/(\d+)(?:-\d+)?\s*reps?\b/i)?.[1] || String(recommendation.recommendedRepTarget || "").match(/\d+/)?.[0] || "";
    return {
      weight: recommendation.recommendedWeight,
      reps,
      repLabel: recommendation.recommendedRepTarget || (reps ? `${reps} reps` : ""),
      reason: recommendation.reason,
      source: "Smart Overload"
    };
  }
  const baselineWeight = Number(baseline?.suggestedWorkingWeight || baseline?.workingWeight) || 0;
  if (baselineWeight > 0) {
    return {
      weight: baselineWeight,
      reps: String(baseline.reps || ""),
      repLabel: baseline.suggestedRepRange || (baseline.reps ? `${baseline.reps} reps` : ""),
      reason: "From your strength baseline.",
      source: "Baseline"
    };
  }
  return null;
};

export const recordLabels = {
  heaviest_weight: "Heaviest weight",
  best_estimated_1rm: "Best estimated 1RM",
  best_reps_at_weight: "Most reps at this weight",
  best_volume: "Best exercise volume"
};

export const recordUnit = (recordType) => (recordType === "best_reps_at_weight" ? " reps" : "kg");
