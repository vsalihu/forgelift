import DeloadRecommendation from "../models/DeloadRecommendation.js";
import { buildDeloadSignals, updateDeloadRecommendations } from "../utils/updateDeloadRecommendations.js";

const allowedStatuses = ["active", "completed", "ignored", "expired"];

export const getDeloadRecommendations = async (req, res) => {
  try {
    const recommendations = await DeloadRecommendation.find({ userId: req.user._id, status: "active" }).sort({
      createdAt: -1
    });

    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch deload recommendations.", error: error.message });
  }
};

export const getDeloadHistory = async (req, res) => {
  try {
    const recommendations = await DeloadRecommendation.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch deload history.", error: error.message });
  }
};

export const getPlateaus = async (req, res) => {
  try {
    const { plateauSummary } = await buildDeloadSignals(req.user);
    return res.json({ plateaus: plateauSummary });
  } catch (error) {
    return res.status(500).json({ message: "Unable to detect plateaus.", error: error.message });
  }
};

export const getFatigue = async (req, res) => {
  try {
    const { fatigueSummary } = await buildDeloadSignals(req.user);
    return res.json({ fatigueSummary });
  } catch (error) {
    return res.status(500).json({ message: "Unable to detect fatigue accumulation.", error: error.message });
  }
};

export const recalculateDeload = async (req, res) => {
  try {
    const result = await updateDeloadRecommendations(req.user);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate deload recommendations.", error: error.message });
  }
};

export const updateDeloadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid deload recommendation status." });
    }

    const recommendation = await DeloadRecommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ message: "Deload recommendation not found." });
    }

    return res.json({ recommendation });
  } catch (error) {
    return res.status(404).json({ message: "Deload recommendation not found.", error: error.message });
  }
};
