import ActivityFeedItem from "../models/ActivityFeedItem.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { getFriendIds } from "./friendController.js";

export const getFeed = async (req, res) => {
  try {
    const friendIds = await getFriendIds(req.user._id);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const query = { userId: { $in: [req.user._id, ...friendIds] } };

    if (req.query.before) {
      query.createdAt = { $lt: new Date(req.query.before) };
    }

    const feed = await ActivityFeedItem.find(query)
      .populate("userId", "name username currentOverallRank")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ feed });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch activity feed.", error: error.message });
  }
};

export const shareWorkout = async (req, res) => {
  try {
    const { workoutTemplateId } = req.body;

    if (!workoutTemplateId) {
      return res.status(400).json({ message: "workoutTemplateId is required." });
    }

    const template = await WorkoutTemplate.findOne({ _id: workoutTemplateId, userId: req.user._id });

    if (!template) {
      return res.status(404).json({ message: "Workout template not found." });
    }

    const feedItem = await ActivityFeedItem.create({
      userId: req.user._id,
      type: "workout_shared",
      workoutName: template.name,
      workoutDescription: template.description,
      sharedExercises: template.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        targetSets: exercise.targetSets,
        targetRepMin: exercise.targetRepMin,
        targetRepMax: exercise.targetRepMax,
        notes: exercise.notes
      }))
    });

    return res.status(201).json({ feedItem });
  } catch (error) {
    return res.status(500).json({ message: "Unable to share workout.", error: error.message });
  }
};

export const saveSharedTemplate = async (req, res) => {
  try {
    const feedItem = await ActivityFeedItem.findOne({ _id: req.params.id, type: "workout_shared" });

    if (!feedItem) {
      return res.status(404).json({ message: "Shared workout not found." });
    }

    const template = await WorkoutTemplate.create({
      userId: req.user._id,
      name: feedItem.workoutName,
      description: feedItem.workoutDescription,
      exercises: feedItem.sharedExercises
    });

    return res.status(201).json({ template });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save shared workout.", error: error.message });
  }
};
