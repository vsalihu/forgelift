import ActivityFeedItem from "../models/ActivityFeedItem.js";
import SharedWorkout from "../models/SharedWorkout.js";
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

const isFriend = async (userId, otherUserId) => {
  const friendIds = await getFriendIds(userId);
  return friendIds.some((id) => id.equals(otherUserId));
};

export const sendWorkout = async (req, res) => {
  try {
    const { workoutTemplateId, friendUserId } = req.body;

    if (!workoutTemplateId || !friendUserId) {
      return res.status(400).json({ message: "workoutTemplateId and friendUserId are required." });
    }

    const template = await WorkoutTemplate.findOne({ _id: workoutTemplateId, userId: req.user._id });

    if (!template) {
      return res.status(404).json({ message: "Workout template not found." });
    }

    if (!(await isFriend(req.user._id, friendUserId))) {
      return res.status(400).json({ message: "You can only send workouts to your friends." });
    }

    const sharedWorkout = await SharedWorkout.create({
      fromUserId: req.user._id,
      toUserId: friendUserId,
      sourceTemplateId: template._id,
      workoutName: template.name,
      workoutDescription: template.description,
      exercises: template.exercises
    });

    return res.status(201).json({ sharedWorkout });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send workout.", error: error.message });
  }
};

export const getInbox = async (req, res) => {
  try {
    const inbox = await SharedWorkout.find({ toUserId: req.user._id })
      .populate("fromUserId", "name username")
      .sort({ createdAt: -1 });

    return res.json({ inbox });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch sent workouts.", error: error.message });
  }
};

export const saveInboxWorkout = async (req, res) => {
  try {
    const sharedWorkout = await SharedWorkout.findOne({ _id: req.params.id, toUserId: req.user._id });

    if (!sharedWorkout) {
      return res.status(404).json({ message: "Shared workout not found." });
    }

    const template = await WorkoutTemplate.create({
      userId: req.user._id,
      name: sharedWorkout.workoutName,
      description: sharedWorkout.workoutDescription,
      exercises: sharedWorkout.exercises
    });

    return res.status(201).json({ template });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save shared workout.", error: error.message });
  }
};
