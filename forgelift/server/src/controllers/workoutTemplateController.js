import Exercise from "../models/Exercise.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";

const normalizeExercise = async (exercise) => {
  let libraryExercise = null;

  if (exercise.exerciseId) {
    libraryExercise = await Exercise.findById(exercise.exerciseId);
  }

  return {
    exerciseId: libraryExercise?._id || exercise.exerciseId,
    exerciseName: libraryExercise?.name || exercise.exerciseName,
    targetSets: Number(exercise.targetSets) || 3,
    targetRepMin: Number(exercise.targetRepMin) || 8,
    targetRepMax: Number(exercise.targetRepMax) || 12,
    notes: exercise.notes || ""
  };
};

const validateTemplate = (payload) => {
  const errors = [];

  if (!payload.name?.trim()) errors.push("Template name is required.");
  if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    errors.push("Template must include at least one exercise.");
  }

  payload.exercises?.forEach((exercise, index) => {
    if (!exercise.exerciseId && !exercise.exerciseName) errors.push(`Exercise ${index + 1} is required.`);
    if (Number(exercise.targetSets) <= 0) errors.push(`${exercise.exerciseName || `Exercise ${index + 1}`} needs target sets.`);
  });

  return errors;
};

const buildTemplateData = async (payload, user) => ({
  userId: user._id,
  name: payload.name.trim(),
  description: payload.description || "",
  goalPath: payload.goalPath || user.goalPath || "",
  exercises: await Promise.all((payload.exercises || []).map(normalizeExercise))
});

export const getWorkoutTemplates = async (req, res) => {
  try {
    const templates = await WorkoutTemplate.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.json({ templates });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch workout templates.", error: error.message });
  }
};

export const getWorkoutTemplate = async (req, res) => {
  try {
    const template = await WorkoutTemplate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!template) return res.status(404).json({ message: "Workout template not found." });
    return res.json({ template });
  } catch (error) {
    return res.status(404).json({ message: "Workout template not found.", error: error.message });
  }
};

export const createWorkoutTemplate = async (req, res) => {
  try {
    const errors = validateTemplate(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const template = await WorkoutTemplate.create(await buildTemplateData(req.body, req.user));
    return res.status(201).json({ template });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create workout template.", error: error.message });
  }
};

export const updateWorkoutTemplate = async (req, res) => {
  try {
    const template = await WorkoutTemplate.findOne({ _id: req.params.id, userId: req.user._id });
    if (!template) return res.status(404).json({ message: "Workout template not found." });

    const errors = validateTemplate(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    Object.assign(template, await buildTemplateData(req.body, req.user));
    await template.save();
    return res.json({ template });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update workout template.", error: error.message });
  }
};

export const deleteWorkoutTemplate = async (req, res) => {
  try {
    const template = await WorkoutTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!template) return res.status(404).json({ message: "Workout template not found." });
    return res.json({ message: "Workout template deleted." });
  } catch (error) {
    return res.status(404).json({ message: "Workout template not found.", error: error.message });
  }
};
