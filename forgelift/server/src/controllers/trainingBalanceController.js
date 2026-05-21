import TrainingBalance from "../models/TrainingBalance.js";
import { updateWeakPoints } from "../utils/updateWeakPoints.js";

export const getTrainingBalance = async (req, res) => {
  try {
    let trainingBalance = await TrainingBalance.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });

    if (!trainingBalance) {
      const result = await updateWeakPoints(req.user);
      trainingBalance = result.trainingBalance;
    }

    return res.json({ trainingBalance });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch training balance.", error: error.message });
  }
};

export const recalculateTrainingBalance = async (req, res) => {
  try {
    const result = await updateWeakPoints(req.user);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate training balance.", error: error.message });
  }
};
