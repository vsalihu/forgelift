import BodyweightEntry from "../models/BodyweightEntry.js";
import CalendarEntry from "../models/CalendarEntry.js";
import DailyLog from "../models/DailyLog.js";
import Workout from "../models/Workout.js";
import { GOALS, SUPPLEMENTS, SUPPLEMENT_KEYS, WHEY_PROTEIN_PER_SCOOP, buildDailyPlan, buildTodos } from "../utils/dailyPlan.js";

const DAY_MS = 86400000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// The app sends its own local date. Allow a day either side of the server's clock for time zones.
const parseDay = (value) => {
  if (typeof value !== "string" || !DAY_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || Math.abs(time - Date.now()) > 2 * DAY_MS) return null;
  return value;
};
// Minutes from Date#getTimezoneOffset (UTC minus local), used to find the local day's hours.
const parseOffset = (value) => {
  const offset = Number(value);
  return Number.isInteger(offset) && offset >= -840 && offset <= 840 ? offset : 0;
};
const shiftDay = (day, delta) => new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
const plainProfile = (user) => {
  const profile = user.dailyProfile;
  return (profile?.toObject ? profile.toObject() : profile) || {};
};
const inRange = (value, min, max) => {
  const number = Number(value);
  return value !== null && value !== "" && Number.isFinite(number) && number >= min && number <= max ? number : null;
};

const detectTraining = async ({ userId, day, offset, log }) => {
  const said = log?.checkIn?.trainingToday;
  if (said === true || said === false) return { isTrainingDay: said, trainingSource: "checkin" };
  const localStart = new Date(Date.parse(`${day}T00:00:00Z`) + offset * 60000);
  const calendarStart = new Date(`${day}T00:00:00Z`);
  const [workout, entry] = await Promise.all([
    Workout.exists({ userId, date: { $gte: localStart, $lt: new Date(localStart.getTime() + DAY_MS) } }),
    CalendarEntry.findOne({ userId, date: { $gte: calendarStart, $lt: new Date(calendarStart.getTime() + DAY_MS) } }).select("type")
  ]);
  if (workout) return { isTrainingDay: true, trainingSource: "logged" };
  if (entry?.type === "planned_workout") return { isTrainingDay: true, trainingSource: "planned" };
  if (entry) return { isTrainingDay: false, trainingSource: "rest" };
  return { isTrainingDay: false, trainingSource: "none" };
};

const planFor = async ({ user, day, offset, log }) => {
  const training = await detectTraining({ userId: user._id, day, offset, log });
  return buildDailyPlan({ user, profile: plainProfile(user), day, ...training, checkIn: log?.checkIn || {} });
};

const respond = async ({ req, res, day, offset, log }) => {
  const plan = await planFor({ user: req.user, day, offset, log });
  const { todos, totals, completion } = buildTodos(plan, log || {});
  if (log && (log.completion?.done !== completion.done || log.completion?.total !== completion.total)) {
    log.completion = completion;
    await log.save();
  }
  const weekLogs = await DailyLog.find({ userId: req.user._id, day: { $gte: shiftDay(day, -6), $lte: day } }).select("day completion");
  const byDay = new Map(weekLogs.map((entry) => [entry.day, entry.completion]));
  const week = Array.from({ length: 7 }, (_, index) => {
    const key = shiftDay(day, index - 6);
    const entry = key === day ? completion : byDay.get(key);
    return { day: key, done: entry?.done || 0, total: entry?.total || 0 };
  });
  const profile = plainProfile(req.user);
  return res.json({
    day,
    profile,
    needsSetup: !profile.completedAt && !profile.skippedAt,
    needsCheckIn: !log?.checkIn?.at && !log?.checkIn?.skipped,
    plan,
    log,
    todos,
    totals,
    completion,
    week,
    wheyProteinPerScoop: WHEY_PROTEIN_PER_SCOOP,
    supplementOptions: SUPPLEMENT_KEYS.map((key) => ({ key, label: SUPPLEMENTS[key].label, trainingOnly: Boolean(SUPPLEMENTS[key].trainingOnly) }))
  });
};

const recordWeight = async (user, weight, source) => {
  const previous = Number(user.bodyweight || 0);
  user.bodyweight = weight;
  if (weight !== previous) {
    user.lastBodyweightCheckInAt = new Date();
    await BodyweightEntry.create({ userId: user._id, weight, unit: user.preferredUnits === "imperial" ? "lb" : "kg", source });
  }
};
const weightRange = (user) => (user.preferredUnits === "imperial" ? [66, 660] : [30, 300]);

export const getDay = async (req, res) => {
  const day = parseDay(req.params.day);
  if (!day) return res.status(400).json({ message: "A valid day (YYYY-MM-DD) near today is required." });
  try {
    const log = await DailyLog.findOne({ userId: req.user._id, day });
    return respond({ req, res, day, offset: parseOffset(req.query.offset), log });
  } catch (error) {
    console.error("Daily plan failed:", error.message);
    return res.status(500).json({ message: "Unable to load today's plan." });
  }
};

export const updateDay = async (req, res) => {
  const day = parseDay(req.params.day);
  if (!day) return res.status(400).json({ message: "A valid day (YYYY-MM-DD) near today is required." });
  const offset = parseOffset(req.query.offset);
  const body = req.body || {};
  try {
    const log = await DailyLog.findOneAndUpdate({ userId: req.user._id, day }, { $setOnInsert: { userId: req.user._id, day } }, { upsert: true, new: true });

    if (body.skipCheckIn === true && !log.checkIn?.at) log.set("checkIn.skipped", true);
    if (body.checkIn && typeof body.checkIn === "object") {
      const { sleepHours, energy, trainingToday, morningWeight } = body.checkIn;
      const sleep = inRange(sleepHours, 0, 16);
      const energyLevel = inRange(energy, 1, 5);
      log.set("checkIn.sleepHours", sleep === null ? undefined : Math.round(sleep * 4) / 4);
      log.set("checkIn.energy", energyLevel === null ? undefined : Math.round(energyLevel));
      log.set("checkIn.trainingToday", trainingToday === true || trainingToday === false ? trainingToday : null);
      const [min, max] = weightRange(req.user);
      const weight = inRange(morningWeight, min, max);
      if (morningWeight !== undefined && morningWeight !== null && morningWeight !== "" && weight === null) {
        return res.status(400).json({ message: `Enter a weight between ${min} and ${max}.`, field: "morningWeight" });
      }
      log.set("checkIn.morningWeight", weight === null ? undefined : Math.round(weight * 10) / 10);
      log.set("checkIn.at", new Date());
      log.set("checkIn.skipped", false);
      if (weight !== null) {
        await recordWeight(req.user, Math.round(weight * 10) / 10, "daily_checkin");
        await req.user.save();
      }
    }

    // Meals and whey count toward the totals, so work out the plan before applying amounts.
    const plan = await planFor({ user: req.user, day, offset, log });

    if (Array.isArray(body.meals)) {
      const meals = body.meals.slice(0, 6).map((done, index) => {
        const previous = log.meals?.[index];
        if (!done) return { done: false, protein: 0, carbs: 0, fat: 0 };
        if (previous?.done) return previous;
        return { done: true, protein: plan.meals.protein, carbs: plan.meals.carbs, fat: plan.meals.fat };
      });
      log.meals = meals;
    }

    if (body.supplements && typeof body.supplements === "object") {
      const next = { ...(log.supplements || {}) };
      for (const [key, value] of Object.entries(body.supplements)) {
        if (!SUPPLEMENT_KEYS.includes(key)) continue;
        const doses = inRange(value, 0, 10);
        if (doses !== null) next[key] = Math.round(doses);
      }
      log.supplements = next;
      log.markModified("supplements");
    }

    // Amounts arrive as the totals the user wants to see; store the part they added themselves.
    if (body.intake && typeof body.intake === "object") {
      const meals = (log.meals || []).filter((meal) => meal?.done);
      const fromMeals = (key) => meals.reduce((total, meal) => total + (Number(meal[key]) || 0), 0);
      const fromWhey = (Number(log.supplements?.whey) || 0) * WHEY_PROTEIN_PER_SCOOP;
      const limits = { protein: 1500, carbs: 2000, fat: 800, waterMl: 15000 };
      for (const key of Object.keys(limits)) {
        if (body.intake[key] === undefined) continue;
        const total = inRange(body.intake[key], 0, limits[key]);
        if (total === null) return res.status(400).json({ message: `Enter a ${key === "waterMl" ? "water amount" : key} value between 0 and ${limits[key]}.`, field: key });
        const derived = key === "waterMl" ? 0 : fromMeals(key) + (key === "protein" ? fromWhey : 0);
        log.set(`intake.${key}`, Math.round(total - derived));
      }
    }

    await log.save();
    return respond({ req, res, day, offset, log });
  } catch (error) {
    console.error("Daily update failed:", error.message);
    return res.status(500).json({ message: "Unable to save that." });
  }
};

export const updateProfile = async (req, res) => {
  const body = req.body || {};
  try {
    const profile = { ...plainProfile(req.user) };
    if (body.skip === true) {
      profile.skippedAt = new Date();
      req.user.dailyProfile = profile;
      await req.user.save();
      return res.json({ profile, user: req.user.toJSON() });
    }

    if (body.goal !== undefined) {
      if (!GOALS.includes(body.goal)) return res.status(400).json({ message: "Pick a goal.", field: "goal" });
      profile.goal = body.goal;
    }
    if (body.sex !== undefined) profile.sex = ["male", "female"].includes(body.sex) ? body.sex : "";
    if (body.trainingDaysPerWeek !== undefined) {
      const days = inRange(body.trainingDaysPerWeek, 0, 7);
      if (days === null) return res.status(400).json({ message: "Training days must be 0 to 7.", field: "trainingDaysPerWeek" });
      profile.trainingDaysPerWeek = Math.round(days);
    }
    if (body.mealsPerDay !== undefined) {
      const meals = inRange(body.mealsPerDay, 2, 6);
      if (meals === null) return res.status(400).json({ message: "Meals must be 2 to 6.", field: "mealsPerDay" });
      profile.mealsPerDay = Math.round(meals);
    }
    if (body.sleepTargetHours !== undefined) {
      const hours = inRange(body.sleepTargetHours, 6, 10);
      if (hours === null) return res.status(400).json({ message: "Sleep target must be 6 to 10 hours.", field: "sleepTargetHours" });
      profile.sleepTargetHours = Math.round(hours * 2) / 2;
    }
    if (typeof body.checkInPrompt === "boolean") {
      // A preference toggle on its own doesn't count as finishing setup.
      profile.checkInPrompt = body.checkInPrompt;
      if (Object.keys(body).filter((key) => key !== "today").length === 1) {
        req.user.dailyProfile = profile;
        await req.user.save();
        return res.json({ profile: plainProfile(req.user), user: req.user.toJSON() });
      }
    }
    if (Array.isArray(body.supplements)) profile.supplements = [...new Set(body.supplements.filter((key) => SUPPLEMENT_KEYS.includes(key)))];
    if (body.creatineMode !== undefined) {
      const mode = ["maintain", "load"].includes(body.creatineMode) ? body.creatineMode : "";
      // Starting a loading phase: day one is the app's today.
      if (mode === "load" && (profile.creatineMode !== "load" || !profile.creatineStartedOn)) {
        profile.creatineStartedOn = parseDay(body.today) || new Date().toISOString().slice(0, 10);
      }
      if (mode !== "load") profile.creatineStartedOn = undefined;
      profile.creatineMode = mode;
    }
    if (!profile.supplements?.includes("creatine")) {
      profile.creatineMode = "";
      profile.creatineStartedOn = undefined;
    }

    if (body.weight !== undefined && body.weight !== "" && body.weight !== null) {
      const [min, max] = weightRange(req.user);
      const weight = inRange(body.weight, min, max);
      if (weight === null) return res.status(400).json({ message: `Enter a weight between ${min} and ${max}.`, field: "weight" });
      await recordWeight(req.user, Math.round(weight * 10) / 10, "profile_update");
    }
    if (body.height !== undefined && body.height !== "" && body.height !== null) {
      const [min, max] = req.user.preferredUnits === "imperial" ? [40, 100] : [100, 250];
      const height = inRange(body.height, min, max);
      if (height === null) return res.status(400).json({ message: `Enter a height between ${min} and ${max}.`, field: "height" });
      req.user.height = Math.round(height * 10) / 10;
    }
    if (body.age !== undefined && body.age !== "" && body.age !== null && !req.user.dateOfBirth) {
      const age = inRange(body.age, 14, 90);
      if (age === null) return res.status(400).json({ message: "Enter an age between 14 and 90.", field: "age" });
      req.user.age = Math.round(age);
    }

    profile.completedAt = new Date();
    req.user.dailyProfile = profile;
    await req.user.save();
    return res.json({ profile: plainProfile(req.user), user: req.user.toJSON() });
  } catch (error) {
    console.error("Daily profile update failed:", error.message);
    return res.status(500).json({ message: "Unable to save your plan settings." });
  }
};
