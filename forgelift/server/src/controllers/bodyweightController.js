import BodyweightEntry from "../models/BodyweightEntry.js";

const getWeekStart = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getWeekEnd = (date = new Date()) => {
  const end = getWeekStart(date);
  end.setDate(end.getDate() + 7);
  return end;
};

const buildLatestPayload = async (user) => {
  const [latestEntry, currentWeekEntry] = await Promise.all([
    BodyweightEntry.findOne({ userId: user._id }).sort({ recordedAt: -1, createdAt: -1 }),
    BodyweightEntry.findOne({
      userId: user._id,
      recordedAt: { $gte: getWeekStart(), $lt: getWeekEnd() }
    }).sort({ recordedAt: -1 })
  ]);

  return {
    latestEntry,
    isCheckInDue: user.bodyweightCheckInReminderEnabled !== false && !currentWeekEntry,
    currentBodyweight: user.bodyweight || latestEntry?.weight || null,
    reminderEnabled: user.bodyweightCheckInReminderEnabled !== false,
    checkInDay: user.bodyweightCheckInDay || "Monday"
  };
};

const createEntry = async ({ user, weight, unit, recordedAt, source = "manual", notes = "" }) => {
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    const error = new Error("Please enter a valid bodyweight.");
    error.statusCode = 400;
    throw error;
  }

  const entry = await BodyweightEntry.create({
    userId: user._id,
    weight: numericWeight,
    unit: unit || (user.preferredUnits === "imperial" ? "lb" : "kg"),
    recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    source,
    notes
  });

  user.bodyweight = numericWeight;
  user.lastBodyweightCheckInAt = entry.recordedAt;
  await user.save();
  return entry;
};

export const getBodyweightHistory = async (req, res) => {
  const entries = await BodyweightEntry.find({ userId: req.user._id }).sort({ recordedAt: -1, createdAt: -1 }).limit(52);
  return res.json({ entries });
};

export const getLatestBodyweight = async (req, res) => {
  const payload = await buildLatestPayload(req.user);
  return res.json(payload);
};

export const addBodyweightEntry = async (req, res) => {
  try {
    const entry = await createEntry({
      user: req.user,
      weight: req.body.weight,
      unit: req.body.unit,
      recordedAt: req.body.recordedAt,
      source: req.body.source || "manual",
      notes: req.body.notes
    });
    const latest = await buildLatestPayload(req.user);
    return res.status(201).json({ entry, ...latest, user: req.user.toJSON() });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to save bodyweight." });
  }
};

export const checkInBodyweight = async (req, res) => {
  try {
    const entry = await createEntry({
      user: req.user,
      weight: req.body.weight,
      unit: req.body.unit,
      source: "weekly_prompt",
      notes: req.body.notes
    });
    const latest = await buildLatestPayload(req.user);
    return res.status(201).json({ entry, ...latest, user: req.user.toJSON() });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Unable to save bodyweight check-in." });
  }
};

export const deleteBodyweightEntry = async (req, res) => {
  try {
    const entry = await BodyweightEntry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: "Bodyweight entry not found." });

    await entry.deleteOne();
    const latestEntry = await BodyweightEntry.findOne({ userId: req.user._id }).sort({ recordedAt: -1, createdAt: -1 });
    req.user.bodyweight = latestEntry?.weight || undefined;
    req.user.lastBodyweightCheckInAt = latestEntry?.recordedAt || undefined;
    await req.user.save();

    const latest = await buildLatestPayload(req.user);
    return res.json({ message: "Bodyweight entry deleted.", ...latest, user: req.user.toJSON() });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete bodyweight entry.", error: error.message });
  }
};
