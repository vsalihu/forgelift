import MonthlyReport from "../models/MonthlyReport.js";
import { generateMonthlyReport } from "../utils/generateMonthlyReport.js";

export const getMonthlyReports = async (req, res) => {
  try {
    const reports = await MonthlyReport.find({ userId: req.user._id }).sort({ year: -1, month: -1 });
    return res.json({ reports });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch monthly reports.", error: error.message });
  }
};

export const getCurrentMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const report = await generateMonthlyReport({
      user: req.user,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    return res.json({ report });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to fetch current report." });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const report = await generateMonthlyReport({
      user: req.user,
      month: req.params.month,
      year: req.params.year
    });
    return res.json({ report });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to fetch monthly report." });
  }
};

export const generateReport = async (req, res) => {
  try {
    const report = await generateMonthlyReport({
      user: req.user,
      month: req.body.month,
      year: req.body.year
    });
    return res.json({ report });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to generate monthly report." });
  }
};
