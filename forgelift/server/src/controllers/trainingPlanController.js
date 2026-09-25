import CalendarEntry from "../models/CalendarEntry.js";
import TrainingPlan from "../models/TrainingPlan.js";
import Workout from "../models/Workout.js";
import { dateKey, generateNewPlan, getTrainingReadiness, regeneratePlanRemainder, startOfUTCDay } from "../utils/generateTrainingPlan.js";

const buildAdherence = async (userId, plan) => {
  const entries = await CalendarEntry.find({ userId, planId: plan._id, type: "planned_workout" }).populate(
    "workoutTemplateId",
    "name exercises"
  );

  const workouts = await Workout.find({ userId, date: { $gte: plan.startDate, $lte: plan.endDate } }).select("date");
  const workoutDateKeys = new Set(workouts.map((workout) => dateKey(workout.date)));
  const today = startOfUTCDay(new Date());

  let completed = 0;
  let missed = 0;
  let scheduled = 0;

  const decoratedEntries = entries.map((entry) => {
    const key = dateKey(entry.date);
    let status;
    if (workoutDateKeys.has(key)) {
      status = "completed";
      completed += 1;
    } else if (entry.date < today) {
      status = "missed";
      missed += 1;
    } else {
      status = "scheduled";
      scheduled += 1;
    }
    return { ...entry.toObject(), status };
  });

  const total = decoratedEntries.length;
  return {
    entries: decoratedEntries,
    adherence: {
      completed,
      missed,
      scheduled,
      total,
      percentage: total ? Math.round((completed / total) * 100) : 0
    }
  };
};

export const getStatus = async (req, res) => {
  try {
    const activePlan = await TrainingPlan.findOne({ userId: req.user._id, status: "active" });

    if (!activePlan) {
      const readiness = await getTrainingReadiness(req.user._id);
      return res.json({ activePlan: null, readiness });
    }

    const { entries, adherence } = await buildAdherence(req.user._id, activePlan);
    return res.json({ activePlan: { ...activePlan.toObject(), entries, adherence }, readiness: null });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch training plan status.", error: error.message });
  }
};

export const generatePlan = async (req, res) => {
  try {
    const durationWeeks = Number(req.body.durationWeeks) === 4 ? 4 : 3;
    const readiness = await getTrainingReadiness(req.user._id);

    if (!readiness.unlocked) {
      return res.status(400).json({ message: "Keep logging workouts to unlock plan generation.", readiness });
    }

    const plan = await generateNewPlan(req.user, durationWeeks);
    const { entries, adherence } = await buildAdherence(req.user._id, plan);
    return res.status(201).json({ activePlan: { ...plan.toObject(), entries, adherence } });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to generate training plan." });
  }
};

export const regenerateRemainder = async (req, res) => {
  try {
    const plan = await TrainingPlan.findOne({ _id: req.params.id, userId: req.user._id, status: "active" });

    if (!plan) {
      return res.status(404).json({ message: "Active training plan not found." });
    }

    await regeneratePlanRemainder(req.user, plan);
    const { entries, adherence } = await buildAdherence(req.user._id, plan);
    return res.json({ activePlan: { ...plan.toObject(), entries, adherence } });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to regenerate training plan." });
  }
};

export const cancelPlan = async (req, res) => {
  try {
    const plan = await TrainingPlan.findOne({ _id: req.params.id, userId: req.user._id, status: "active" });

    if (!plan) {
      return res.status(404).json({ message: "Active training plan not found." });
    }

    plan.status = "cancelled";
    await plan.save();

    await CalendarEntry.deleteMany({
      userId: req.user._id,
      planId: plan._id,
      source: "generated",
      date: { $gte: startOfUTCDay(new Date()) }
    });

    return res.json({ message: "Training plan cancelled." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel training plan.", error: error.message });
  }
};
