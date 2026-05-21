import Exercise from "../models/Exercise.js";
import Assessment from "../models/Assessment.js";
import { calculateEstimated1RM } from "../utils/calculateEstimated1RM.js";
import { calculateAssessmentLevel } from "../utils/calculateAssessmentLevel.js";
import { estimateRelatedExerciseStrength, mergeEstimatedBaselines } from "../utils/estimateRelatedExerciseStrength.js";
import { generateAssessmentRecommendations } from "../utils/generateAssessmentRecommendations.js";

const ASSESSMENT_VERSION = 1;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPlainBaseline = (baseline) => (typeof baseline?.toObject === "function" ? baseline.toObject() : baseline);

const calculateBaselineOneRepMax = (weight, reps) => {
  if (Number(reps) === 1) return Number(weight);
  return calculateEstimated1RM(weight, reps);
};

const normaliseLifts = (lifts = []) => {
  const list = Array.isArray(lifts) ? lifts : Object.values(lifts || {});

  return list
    .filter((lift) => lift && !lift.unknown && lift.exerciseName)
    .map((lift) => ({
      exerciseName: String(lift.exerciseName).trim(),
      weight: Number(lift.weight),
      reps: Number(lift.reps),
      rpe: lift.rpe ? Number(lift.rpe) : null
    }))
    .filter((lift) => lift.exerciseName);
};

const validateLifts = (lifts) => {
  const errors = [];

  lifts.forEach((lift) => {
    if (Number.isNaN(lift.weight) || lift.weight <= 0) {
      errors.push(`${lift.exerciseName}: weight must be greater than 0.`);
    }
    if (Number.isNaN(lift.reps) || lift.reps <= 0) {
      errors.push(`${lift.exerciseName}: reps must be greater than 0.`);
    }
    if (lift.reps > 30) {
      errors.push(`${lift.exerciseName}: reps must be 30 or less for a useful estimate.`);
    }
    if (lift.rpe && (lift.rpe < 1 || lift.rpe > 10)) {
      errors.push(`${lift.exerciseName}: RPE must be between 1 and 10.`);
    }
  });

  return errors;
};

const findExerciseByName = async (exerciseName) =>
  Exercise.findOne({ name: new RegExp(`^${escapeRegex(exerciseName)}$`, "i") });

const buildAssessmentBaselines = async ({ user, enteredLifts }) => {
  const exerciseLibrary = await Exercise.find({});
  const existingUserBaselines = (user.strengthBaselines || [])
    .map(toPlainBaseline)
    .filter((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
  const baselineMap = new Map(existingUserBaselines.map((baseline) => [baseline.exerciseName, baseline]));
  const enteredBaselines = [];

  for (const lift of enteredLifts) {
    const exercise = await findExerciseByName(lift.exerciseName);
    if (!exercise) continue;

    const estimatedOneRepMax = calculateBaselineOneRepMax(lift.weight, lift.reps);
    const baseline = {
      ...(baselineMap.get(exercise.name) || {}),
      exerciseName: exercise.name,
      exerciseId: exercise._id,
      estimatedOneRepMax,
      workingWeight: lift.weight,
      reps: lift.reps,
      suggestedWorkingWeight: lift.weight,
      suggestedRepRange: `${lift.reps} reps`,
      confidence: "High",
      source: "user_entered",
      sourceExerciseName: "",
      ratioUsed: 1,
      note: "Created from ForgeLift Assessment.",
      updatedAt: new Date()
    };

    baselineMap.set(exercise.name, baseline);
    enteredBaselines.push(baseline);
  }

  const userEnteredBaselines = [...baselineMap.values()];
  const estimatedBaselines = userEnteredBaselines.flatMap((baseline) =>
    estimateRelatedExerciseStrength({
      baselineExerciseName: baseline.exerciseName,
      estimatedOneRepMax: baseline.estimatedOneRepMax,
      exerciseLibrary
    })
  );

  return {
    enteredBaselines,
    baselines: mergeEstimatedBaselines({ userEnteredBaselines, estimatedBaselines })
  };
};

const processAssessment = async ({ user, answers }) => {
  const enteredLifts = normaliseLifts(answers?.lifts);
  const errors = validateLifts(enteredLifts);

  if (errors.length) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  const liftsWithEstimates = enteredLifts.map((lift) => ({
    ...lift,
    estimatedOneRepMax: calculateBaselineOneRepMax(lift.weight, lift.reps)
  }));
  const levelResult = calculateAssessmentLevel({ user, answers, enteredLifts: liftsWithEstimates });
  const recommendations = generateAssessmentRecommendations({
    calculatedLevel: levelResult.calculatedLevel,
    goalPath: answers.goalPath || user.goalPath,
    enteredLifts: liftsWithEstimates,
    weakestArea: levelResult.weakestArea,
    limitations: answers.limitations || [],
    preferredTrainingStyle: answers.preferredTrainingStyle || ""
  });
  const { enteredBaselines, baselines } = await buildAssessmentBaselines({ user, enteredLifts: liftsWithEstimates });
  const completedAt = new Date();

  user.trainingExperience = levelResult.calculatedLevel;
  if (answers.goalPath) user.goalPath = answers.goalPath;
  user.assessmentCompleted = true;
  user.assessmentCompletedAt = completedAt;
  user.assessmentSkippedAt = undefined;
  user.assessmentVersion = ASSESSMENT_VERSION;
  user.assessmentSummary = {
    determinedLevel: levelResult.calculatedLevel,
    confidence: levelResult.confidence,
    mainGoal: answers.goalPath || user.goalPath || "",
    trainingAgeMonths: levelResult.trainingAgeMonths,
    weeklyTrainingFrequency: levelResult.weeklyTrainingFrequency,
    strongestLift: levelResult.strongestLift,
    weakestArea: levelResult.weakestArea,
    recommendationSummary: recommendations[0] || ""
  };
  user.strengthBaselines = baselines;
  user.strengthBaselineUpdatedAt = completedAt;
  await user.save();

  const assessment = await Assessment.create({
    userId: user._id,
    version: ASSESSMENT_VERSION,
    status: "completed",
    answers,
    calculatedLevel: levelResult.calculatedLevel,
    confidence: levelResult.confidence,
    strengthBaselinesCreated: enteredBaselines,
    estimatedRankPreview: {
      trainingExperience: levelResult.calculatedLevel,
      note: "Actual ForgeLift ranks remain based mostly on real logged workouts."
    },
    recommendations,
    completedAt
  });

  return {
    assessment,
    levelResult,
    recommendations,
    baselines,
    enteredBaselines
  };
};

export const getLatestAssessment = async (req, res) => {
  const assessment = await Assessment.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

  return res.json({
    assessment,
    assessmentSummary: req.user.assessmentSummary || null,
    assessmentCompleted: req.user.assessmentCompleted,
    assessmentCompletedAt: req.user.assessmentCompletedAt,
    assessmentSkippedAt: req.user.assessmentSkippedAt
  });
};

export const completeAssessment = async (req, res) => {
  try {
    const answers = req.body?.answers || req.body || {};
    const result = await processAssessment({ user: req.user, answers });

    return res.status(201).json({
      assessment: result.assessment,
      user: req.user,
      levelResult: result.levelResult,
      recommendations: result.recommendations,
      baselines: result.baselines,
      warning:
        "Assessment estimates are starting points only. Real workout history should override estimated recommendations."
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to complete assessment.",
      errors: error.errors || undefined
    });
  }
};

export const skipAssessment = async (req, res) => {
  const skippedAt = new Date();

  req.user.assessmentSkippedAt = skippedAt;
  await req.user.save();

  const assessment = await Assessment.create({
    userId: req.user._id,
    version: ASSESSMENT_VERSION,
    status: "skipped",
    answers: {},
    recommendations: ["Start by logging your first workouts. ForgeLift will learn your level from real training data."]
  });

  return res.json({
    assessment,
    user: req.user,
    message: "Assessment skipped for now."
  });
};

export const getAssessmentHistory = async (req, res) => {
  const assessments = await Assessment.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ assessments });
};

export const recalculateAssessment = async (req, res) => {
  try {
    const latest = await Assessment.findOne({ userId: req.user._id, status: "completed" }).sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({ message: "No completed assessment found to recalculate." });
    }

    const result = await processAssessment({ user: req.user, answers: latest.answers });

    return res.json({
      assessment: result.assessment,
      user: req.user,
      levelResult: result.levelResult,
      recommendations: result.recommendations,
      baselines: result.baselines
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to recalculate assessment." });
  }
};
