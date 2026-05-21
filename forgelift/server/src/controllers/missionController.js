import Mission from "../models/Mission.js";
import Streak from "../models/Streak.js";
import WeeklyTarget from "../models/WeeklyTarget.js";
import { updateWeeklyMissions } from "../utils/updateWeeklyMissions.js";
import { getCurrentWeekRange } from "../utils/weekUtils.js";

const allowedStatuses = ["completed", "failed", "expired"];

export const getMissions = async (req, res) => {
  try {
    const result = await updateWeeklyMissions({ user: req.user });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch missions.", error: error.message });
  }
};

export const getMissionHistory = async (req, res) => {
  try {
    const missions = await Mission.find({
      userId: req.user._id,
      status: { $in: ["completed", "failed", "expired"] }
    }).sort({ updatedAt: -1 });

    return res.json({ missions });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch mission history.", error: error.message });
  }
};

export const generateMissions = async (req, res) => {
  try {
    const result = await updateWeeklyMissions({ user: req.user });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to generate missions.", error: error.message });
  }
};

export const recalculateMissions = async (req, res) => {
  try {
    const result = await updateWeeklyMissions({ user: req.user, forceRegenerate: true });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate missions.", error: error.message });
  }
};

export const updateMissionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid mission status." });
    }

    const mission = await Mission.findOne({ _id: req.params.id, userId: req.user._id });

    if (!mission) {
      return res.status(404).json({ message: "Mission not found." });
    }

    const wasActive = mission.status === "active";
    mission.status = status;
    mission.progressPercentage = status === "completed" ? 100 : mission.progressPercentage;
    mission.currentValue = status === "completed" ? mission.targetValue : mission.currentValue;
    mission.completedAt = status === "completed" ? mission.completedAt || new Date() : mission.completedAt;
    await mission.save();

    if (status === "completed" && wasActive) {
      req.user.xp = (req.user.xp || 0) + (mission.xpReward || 0);
      await req.user.save();
    }

    const result = await updateWeeklyMissions({ user: req.user });
    return res.json({ mission, ...result });
  } catch (error) {
    return res.status(404).json({ message: "Mission not found.", error: error.message });
  }
};

export const getWeeklyTarget = async (req, res) => {
  try {
    const { weekStart } = getCurrentWeekRange();
    let weeklyTarget = await WeeklyTarget.findOne({ userId: req.user._id, weekStart });

    if (!weeklyTarget) {
      const result = await updateWeeklyMissions({ user: req.user });
      weeklyTarget = result.weeklyTarget;
    }

    const streaks = await Streak.find({ userId: req.user._id, active: true });
    return res.json({ weeklyTarget, streaks });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch weekly target.", error: error.message });
  }
};
