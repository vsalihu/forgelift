import CalendarEntry from "../models/CalendarEntry.js";
import Workout from "../models/Workout.js";
import WorkoutTemplate from "../models/WorkoutTemplate.js";
import { dateKey, startOfUTCDay } from "../utils/generateTrainingPlan.js";

const entryTypes = ["rest", "treatment", "planned_workout"];

export const getMonth = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "A valid year and month (1-12) are required." });
    }

    const rangeStart = new Date(Date.UTC(year, month - 1, 1));
    const rangeEnd = new Date(Date.UTC(year, month, 1));

    const [workouts, entries] = await Promise.all([
      Workout.find({ userId: req.user._id, date: { $gte: rangeStart, $lt: rangeEnd } }).select(
        "title date totalVolume totalSets bestEstimated1RM groupedMuscleLoadSummary"
      ),
      CalendarEntry.find({ userId: req.user._id, date: { $gte: rangeStart, $lt: rangeEnd } }).populate(
        "workoutTemplateId",
        "name exercises"
      )
    ]);

    const workoutsByDate = new Map();
    workouts.forEach((workout) => {
      const key = dateKey(workout.date);
      const bucket = workoutsByDate.get(key) || [];
      bucket.push(workout);
      workoutsByDate.set(key, bucket);
    });

    const entriesByDate = new Map(entries.map((entry) => [dateKey(entry.date), entry]));
    const allKeys = new Set([...workoutsByDate.keys(), ...entriesByDate.keys()]);

    const days = [...allKeys]
      .sort()
      .map((key) => ({
        date: key,
        workouts: workoutsByDate.get(key) || [],
        entry: entriesByDate.get(key) || null
      }));

    return res.json({ days });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch calendar month.", error: error.message });
  }
};

export const upsertEntry = async (req, res) => {
  try {
    const { date, type, notes, workoutTemplateId, plannedTitle } = req.body;

    if (!date || !entryTypes.includes(type)) {
      return res.status(400).json({ message: "A date and a valid type (rest, treatment, planned_workout) are required." });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date." });
    }

    let resolvedTemplateName = "";
    if (type === "planned_workout" && workoutTemplateId) {
      const template = await WorkoutTemplate.findOne({ _id: workoutTemplateId, userId: req.user._id });
      if (!template) {
        return res.status(404).json({ message: "Workout template not found." });
      }
      resolvedTemplateName = template.name;
    }

    const entry = await CalendarEntry.findOneAndUpdate(
      { userId: req.user._id, date: startOfUTCDay(parsedDate) },
      {
        $set: {
          type,
          notes: notes || "",
          source: "manual",
          planId: null,
          isDeloadWeek: false,
          workoutTemplateId: type === "planned_workout" ? workoutTemplateId || null : null,
          plannedTitle: type === "planned_workout" ? resolvedTemplateName || plannedTitle || "" : "",
          plannedExercises: [],
          muscleGroups: []
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("workoutTemplateId", "name exercises");

    return res.json({ entry });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save calendar entry.", error: error.message });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const entry = await CalendarEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!entry) {
      return res.status(404).json({ message: "Calendar entry not found." });
    }

    return res.json({ message: "Calendar entry removed." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to remove calendar entry.", error: error.message });
  }
};
