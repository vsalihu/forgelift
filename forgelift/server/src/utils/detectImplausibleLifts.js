import { getStrengthStandardTargets } from "./strengthStandards.js";

const KG_PER_LB = 0.453592;
const MAX_JUMP_RATIO = 1.2;
const MIN_JUMP_KG = 10;
// Beyond this multiple of the top ("Ultimate") strength standard for bodyweight is world-record territory.
const STANDARD_MARGIN = 1.35;
const MAX_REPS_PER_SET = 100;
const MAX_SESSION_VOLUME_KG = 60000;

// Workouts are always saved for the user; these reasons only keep a workout off public leaderboards.
export const detectImplausibleLifts = ({ exercises = [], previousBestByExercise = new Map(), user = {}, totalVolume = 0 }) => {
  const toKg = user.preferredUnits === "imperial" ? KG_PER_LB : 1;
  const bodyweightKg = (Number(user.bodyweight) || 0) * toKg;
  const flags = [];

  exercises.forEach((exercise) => {
    const best = Number(exercise.exerciseBestEstimated1RM) || 0;
    const previousBest = Number(previousBestByExercise.get(exercise.exerciseName)) || 0;

    if (previousBest && best > previousBest * MAX_JUMP_RATIO && (best - previousBest) * toKg > MIN_JUMP_KG) {
      flags.push(`${exercise.exerciseName}: estimated max jumped more than 20% over your previous best`);
    }

    const targets = getStrengthStandardTargets(user.selectedStrengthStandard || "neutral", exercise.exerciseName);
    if (targets && bodyweightKg && (best * toKg) / bodyweightKg > targets[targets.length - 1] * STANDARD_MARGIN) {
      flags.push(`${exercise.exerciseName}: far above world-class strength for your bodyweight`);
    }

    if ((exercise.sets || []).some((set) => set.completed !== false && Number(set.reps) > MAX_REPS_PER_SET)) {
      flags.push(`${exercise.exerciseName}: more than ${MAX_REPS_PER_SET} reps in a single set`);
    }
  });

  if (totalVolume * toKg > MAX_SESSION_VOLUME_KG) {
    flags.push("Session volume is beyond what's realistic for one workout");
  }

  return flags;
};
