import Exercise from "../models/Exercise.js";
import { getRelatedMuscleNames, normalizeMuscleName } from "../utils/muscleTaxonomy.js";

const validExerciseTypes = ["compound", "isolation", "machine", "bodyweight", "cardio"];
const validDifficulties = ["Beginner", "Intermediate", "Advanced"];

const cleanStringArray = (items = []) =>
  Array.isArray(items)
    ? [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const buildExercisePayload = (body, userId = null) => {
  const primaryMuscles = cleanStringArray(body.primaryMuscles);
  const secondaryMuscles = cleanStringArray(body.secondaryMuscles);
  const stabiliserMuscles = cleanStringArray(body.stabiliserMuscles);
  const mainMuscleGroups = cleanStringArray(body.mainMuscleGroups);
  const detailedMuscles = cleanStringArray(body.detailedMuscles);
  const selectedMuscles = [...primaryMuscles, ...secondaryMuscles, ...stabiliserMuscles];
  const impactProfile = Object.entries(body.impactProfile || {}).reduce((profile, [muscle, value]) => {
    const cleanMuscle = String(muscle || "").trim();
    const numericValue = Number(value);
    if (cleanMuscle && Number.isFinite(numericValue) && numericValue > 0) {
      profile[cleanMuscle] = Math.min(100, Math.max(0, numericValue));
    }
    return profile;
  }, {});

  selectedMuscles.forEach((muscle) => {
    if (impactProfile[muscle] === undefined) {
      impactProfile[muscle] = primaryMuscles.includes(muscle) ? 100 : secondaryMuscles.includes(muscle) ? 40 : 15;
    }
  });

  return {
    name: String(body.name || "").trim(),
    category: String(body.category || "").trim(),
    mainMuscleGroups,
    detailedMuscles,
    exerciseType: body.exerciseType || "compound",
    primaryMuscles,
    secondaryMuscles,
    stabiliserMuscles,
    defaultRepMin: Number(body.defaultRepMin || 1),
    defaultRepMax: Number(body.defaultRepMax || 12),
    overloadIncrementKg: Number(body.overloadIncrementKg || 0),
    impactProfile,
    instructions: String(body.instructions || "").trim(),
    equipment: String(body.equipment || "").trim(),
    difficulty: body.difficulty || "",
    movementPattern: String(body.movementPattern || "").trim(),
    isDefault: false,
    isCustom: Boolean(userId),
    createdBy: userId,
    visibility: "private"
  };
};

const validateExercisePayload = (payload) => {
  if (!payload.name) return "Exercise name is required.";
  if (!validExerciseTypes.includes(payload.exerciseType)) return "Please choose a valid exercise type.";
  if (payload.difficulty && !validDifficulties.includes(payload.difficulty)) return "Please choose a valid difficulty.";
  if (!payload.primaryMuscles.length) return "At least one primary muscle is required.";
  if (payload.defaultRepMin <= 0 || payload.defaultRepMax <= 0 || payload.defaultRepMin > payload.defaultRepMax) {
    return "Please choose a valid default rep range.";
  }
  return "";
};

const canUseExercise = (exercise, userId) =>
  exercise.isDefault || exercise.visibility === "public" || (userId && String(exercise.createdBy) === String(userId));

const buildImpactProfileKeyFilter = (muscle) => ({
  $expr: {
    $gt: [
      {
        $size: {
          $filter: {
            input: { $objectToArray: { $ifNull: ["$impactProfile", {}] } },
            as: "impact",
            cond: {
              $regexMatch: {
                input: "$$impact.k",
                regex: muscle,
                options: "i"
              }
            }
          }
        }
      },
      0
    ]
  }
});

export const getExercises = async (req, res) => {
  try {
    const { muscle, type, search, category, equipment, difficulty } = req.query;
    const filters = {};
    const accessFilter = req.user?._id
      ? {
          $or: [
            { isDefault: true },
            { isCustom: { $ne: true } },
            { visibility: "public" },
            { createdBy: req.user._id }
          ]
        }
      : {
          $or: [{ isDefault: true }, { isCustom: { $ne: true } }, { visibility: "public" }]
        };

    if (type) {
      filters.exerciseType = type;
    }

    if (category) {
      filters.category = { $regex: category, $options: "i" };
    }

    if (equipment) {
      filters.equipment = { $regex: equipment, $options: "i" };
    }

    if (difficulty) {
      filters.difficulty = { $regex: `^${difficulty}$`, $options: "i" };
    }

    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }

    if (muscle) {
      const muscleNames = getRelatedMuscleNames(muscle).map((name) => normalizeMuscleName(name));
      const muscleRegexes = [...new Set(muscleNames)].map((name) => new RegExp(name, "i"));
      filters.$or = [
        { category: { $in: muscleRegexes } },
        { mainMuscleGroups: { $in: muscleRegexes } },
        { detailedMuscles: { $in: muscleRegexes } },
        { primaryMuscles: { $in: muscleRegexes } },
        { secondaryMuscles: { $in: muscleRegexes } },
        { stabiliserMuscles: { $in: muscleRegexes } },
        ...muscleNames.map((name) => buildImpactProfileKeyFilter(name))
      ];
    }

    const exercises = await Exercise.find({ $and: [accessFilter, filters] }).sort({ name: 1 });
    return res.json({ exercises });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch exercises.", error: error.message });
  }
};

export const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise || !canUseExercise(exercise, req.user?._id)) {
      return res.status(404).json({ message: "Exercise not found." });
    }

    return res.json({ exercise });
  } catch (_error) {
    return res.status(404).json({ message: "Exercise not found." });
  }
};

export const createExercise = async (req, res) => {
  try {
    const payload = buildExercisePayload(req.body);
    const validationError = validateExercisePayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const existingExercise = await Exercise.findOne({ name: payload.name });

    if (existingExercise) {
      return res.status(409).json({ message: "An exercise with this name already exists." });
    }

    const exercise = await Exercise.create(payload);

    return res.status(201).json({ exercise });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create exercise.", error: error.message });
  }
};

export const createCustomExercise = async (req, res) => {
  try {
    const payload = buildExercisePayload(req.body, req.user._id);
    const validationError = validateExercisePayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const existingExercise = await Exercise.findOne({ name: payload.name });
    if (existingExercise) {
      return res.status(409).json({ message: "An exercise with this name already exists." });
    }

    const exercise = await Exercise.create(payload);
    return res.status(201).json({ exercise });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create custom exercise.", error: error.message });
  }
};

export const updateCustomExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise || !exercise.isCustom || String(exercise.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ message: "Custom exercise not found." });
    }

    const payload = buildExercisePayload({ ...exercise.toObject(), ...req.body }, req.user._id);
    const validationError = validateExercisePayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const duplicate = await Exercise.findOne({ name: payload.name, _id: { $ne: exercise._id } });
    if (duplicate) return res.status(409).json({ message: "An exercise with this name already exists." });

    Object.assign(exercise, payload);
    await exercise.save();
    return res.json({ exercise });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update custom exercise.", error: error.message });
  }
};

export const deleteCustomExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise || !exercise.isCustom || String(exercise.createdBy) !== String(req.user._id)) {
      return res.status(404).json({ message: "Custom exercise not found." });
    }

    await exercise.deleteOne();
    return res.json({ message: "Custom exercise deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete custom exercise.", error: error.message });
  }
};
