import MuscleRank from "../models/MuscleRank.js";
import { getRankProgress } from "../utils/rankConfig.js";
import { recalculateUserRanks } from "../utils/calculateRanks.js";

const buildRankResponse = async (user) => {
  const muscleRanks = await MuscleRank.find({ userId: user._id }).sort({ muscleGroup: 1 });
  const overallScore = user.overallRankScore || 0;

  return {
    overallRank: user.currentOverallRank || "Copper",
    overallScore,
    overallProgress: getRankProgress(overallScore),
    xp: user.xp || 0,
    muscleRanks
  };
};

export const getRanks = async (req, res) => {
  try {
    const rankData = await buildRankResponse(req.user);
    return res.json(rankData);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch ranks.", error: error.message });
  }
};

export const recalculateRanks = async (req, res) => {
  try {
    const rankData = await recalculateUserRanks(req.user);
    return res.json(rankData);
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate ranks.", error: error.message });
  }
};

export const getMuscleRank = async (req, res) => {
  try {
    const muscleGroup = decodeURIComponent(req.params.muscleGroup);
    let muscleRank = await MuscleRank.findOne({ userId: req.user._id, muscleGroup });

    if (!muscleRank) {
      const rankData = await recalculateUserRanks(req.user);
      muscleRank = rankData.muscleRanks.find((rank) => rank.muscleGroup === muscleGroup);
    }

    if (!muscleRank) {
      return res.status(404).json({ message: "Muscle rank not found." });
    }

    return res.json({ muscleRank });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch muscle rank.", error: error.message });
  }
};
