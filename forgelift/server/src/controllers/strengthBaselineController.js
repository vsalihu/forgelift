import mongoose from "mongoose";
import Exercise from "../models/Exercise.js";
import { calculateEstimated1RM } from "../utils/calculateEstimated1RM.js";
import { estimateRelatedExerciseStrength, mergeEstimatedBaselines } from "../utils/estimateRelatedExerciseStrength.js";

const baselineExercises = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-up",
  "Hip Thrust",
  "Romanian Deadlift"
];

const toPlainBaseline = (baseline) => (typeof baseline.toObject === "function" ? baseline.toObject() : baseline);

const validateBaselinePayload = ({ weight, reps }) => {
  const errors = [];
  const numericWeight = Number(weight);
  const numericReps = Number(reps);

  if (Number.isNaN(numericWeight) || numericWeight <= 0) {
    errors.push("Weight must be greater than 0.");
  }

  if (Number.isNaN(numericReps) || numericReps <= 0) {
    errors.push("Reps must be greater than 0.");
  }

  if (numericReps > 30) {
    errors.push("Reps must be 30 or less for a useful strength estimate.");
  }

  return errors;
};

const calculateBaselineOneRepMax = (weight, reps) => {
  if (Number(reps) === 1) return Number(weight);
  return calculateEstimated1RM(weight, reps);
};

const findExercise = async ({ exerciseId, exerciseName }) => {
  if (exerciseId) {
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      const error = new Error("Invalid exercise id.");
      error.statusCode = 400;
      throw error;
    }

    const exercise = await Exercise.findById(exerciseId);
    if (exercise) return exercise;
  }

  if (exerciseName) {
    return Exercise.findOne({ name: new RegExp(`^${exerciseName}$`, "i") });
  }

  return null;
};

const rebuildEstimates = async (user) => {
  const exerciseLibrary = await Exercise.find({});
  const userEnteredBaselines = (user.strengthBaselines || [])
    .map(toPlainBaseline)
    .filter((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
  const estimatedBaselines = userEnteredBaselines.flatMap((baseline) =>
    estimateRelatedExerciseStrength({
      baselineExerciseName: baseline.exerciseName,
      estimatedOneRepMax: baseline.estimatedOneRepMax,
      exerciseLibrary
    })
  );

  user.strengthBaselines = mergeEstimatedBaselines({ userEnteredBaselines, estimatedBaselines });
  user.strengthBaselineUpdatedAt = new Date();
  await user.save();
  return user.strengthBaselines;
};

export const getStrengthBaselines = async (req, res) => {
  return res.json({
    baselineExercises,
    baselines: req.user.strengthBaselines || [],
    warning:
      "These are estimated starting points based on your entered strength baseline. Adjust them based on your real performance."
  });
};

export const saveStrengthBaseline = async (req, res) => {
  try {
    const errors = validateBaselinePayload(req.body);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const exercise = await findExercise(req.body);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found." });
    }

    const weight = Number(req.body.weight);
    const reps = Number(req.body.reps);
    const estimatedOneRepMax = calculateBaselineOneRepMax(weight, reps);
    const userEntered = (req.user.strengthBaselines || [])
      .map(toPlainBaseline)
      .filter((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
    const existingIndex = userEntered.findIndex((baseline) => baseline.exerciseName === exercise.name);
    const baseline = {
      ...(existingIndex >= 0 ? userEntered[existingIndex] : {}),
      exerciseName: exercise.name,
      exerciseId: exercise._id,
      estimatedOneRepMax,
      workingWeight: weight,
      reps,
      suggestedWorkingWeight: weight,
      suggestedRepRange: `${reps} reps`,
      confidence: "High",
      source: "user_entered",
      sourceExerciseName: "",
      ratioUsed: 1,
      note: "User-entered strength baseline.",
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      userEntered[existingIndex] = baseline;
    } else {
      userEntered.push(baseline);
    }

    req.user.strengthBaselines = userEntered;
    const baselines = await rebuildEstimates(req.user);

    return res.status(201).json({
      baselines,
      savedBaseline: baseline,
      warning:
        "These are estimated starting points based on your entered strength baseline. Adjust them based on your real performance."
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to save strength baseline." });
  }
};

export const updateStrengthBaseline = async (req, res) => {
  try {
    const errors = validateBaselinePayload(req.body);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const baseline = req.user.strengthBaselines.id(req.params.id);

    if (!baseline) {
      return res.status(404).json({ message: "Strength baseline not found." });
    }

    if (baseline.source !== "user_entered" && baseline.source !== "workout_history") {
      return res.status(400).json({ message: "Only user-entered baselines can be edited directly." });
    }

    const weight = Number(req.body.weight);
    const reps = Number(req.body.reps);
    baseline.workingWeight = weight;
    baseline.reps = reps;
    baseline.estimatedOneRepMax = calculateBaselineOneRepMax(weight, reps);
    baseline.suggestedWorkingWeight = weight;
    baseline.suggestedRepRange = `${reps} reps`;
    baseline.updatedAt = new Date();

    const baselines = await rebuildEstimates(req.user);
    return res.json({ baselines });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update strength baseline.", error: error.message });
  }
};

export const deleteStrengthBaseline = async (req, res) => {
  try {
    const baseline = req.user.strengthBaselines.id(req.params.id);

    if (!baseline) {
      return res.status(404).json({ message: "Strength baseline not found." });
    }

    if (baseline.source === "estimated_from_baseline") {
      req.user.strengthBaselines.pull(req.params.id);
      req.user.strengthBaselineUpdatedAt = new Date();
      await req.user.save();
      return res.json({ baselines: req.user.strengthBaselines });
    }

    req.user.strengthBaselines = (req.user.strengthBaselines || [])
      .map(toPlainBaseline)
      .filter((item) => String(item._id) !== req.params.id && item.source !== "estimated_from_baseline");

    const baselines = await rebuildEstimates(req.user);
    return res.json({ baselines });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete strength baseline.", error: error.message });
  }
};

export const recalculateStrengthBaselines = async (req, res) => {
  try {
    const baselines = await rebuildEstimates(req.user);
    return res.json({
      baselines,
      warning:
        "These are estimated starting points based on your entered strength baseline. Adjust them based on your real performance."
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate strength baselines.", error: error.message });
  }
};
