import WeakPoint from "../models/WeakPoint.js";
import { updateWeakPoints } from "../utils/updateWeakPoints.js";

const severityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const sortWeakPoints = (weakPoints) =>
  weakPoints.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

export const getWeakPoints = async (req, res) => {
  try {
    const weakPoints = await WeakPoint.find({ userId: req.user._id, active: true }).sort({ updatedAt: -1 });
    return res.json({ weakPoints: sortWeakPoints(weakPoints) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch weak points.", error: error.message });
  }
};

export const recalculateWeakPoints = async (req, res) => {
  try {
    const result = await updateWeakPoints(req.user);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to recalculate weak points.", error: error.message });
  }
};

export const getWeakPointHistory = async (req, res) => {
  try {
    const weakPoints = await WeakPoint.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    return res.json({ weakPoints });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch weak point history.", error: error.message });
  }
};
