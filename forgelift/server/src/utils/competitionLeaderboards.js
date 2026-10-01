const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const KG_PER_LB = 0.453592;
// Weight boards only count a healthy pace of change; anything faster still logs but scores no extra.
const MAX_WEIGHT_CHANGE_PERCENT_PER_WEEK = 1;

export const BOARD_TYPES = ["prs", "volume", "progress", "weight_gain", "weight_loss"];
export const SCOPES = ["city", "country", "world"];
export const PERIODS = ["week", "month", "year", "all"];
export const GENDER_DIVISIONS = ["open", "men", "women"];
export const MIN_AGE = 18;
export const AGE_GROUPS = [
  { key: "18-24", min: 18, max: 24 },
  { key: "25-34", min: 25, max: 34 },
  { key: "35-44", min: 35, max: 44 },
  { key: "45-54", min: 45, max: 54 },
  { key: "55+", min: 55, max: 150 }
];

export const ageThisYear = (birthYear, now = new Date()) => new Date(now).getUTCFullYear() - Number(birthYear);

export const getAgeGroup = (birthYear, now = new Date()) => {
  const age = ageThisYear(birthYear, now);
  return AGE_GROUPS.find((group) => age >= group.min && age <= group.max)?.key || null;
};

export const getGenderDivision = (gender) => (gender === "male" ? "men" : gender === "female" ? "women" : null);

export const getPeriodStart = (period, now = new Date()) => {
  const date = new Date(now);
  if (period === "week") {
    const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return new Date(start - ((date.getUTCDay() + 6) % 7) * DAY_MS);
  }
  if (period === "month") return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  if (period === "year") return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return null;
};

// A new week/month/year is a new board, so a fresh period never reads as "you dropped".
export const buildBoardKey = ({ type, scope, period, gender, age, regionId, periodStart }) =>
  [type, scope, period, gender, age, scope === "world" ? "world" : regionId, periodStart ? new Date(periodStart).toISOString().slice(0, 10) : "all"].join(":");

const toMs = (date) => new Date(date).getTime();
const key = (id) => String(id);
const isEligible = (doc) => doc.leaderboardEligible !== false;

// Total kg lifted in the period. Workout weights are stored in each user's own unit.
export const scoreVolume = ({ workouts, start, imperialUserIds = new Set() }) => {
  const scores = new Map();
  workouts.forEach((workout) => {
    if (!isEligible(workout) || (start && toMs(workout.date) < toMs(start))) return;
    const factor = imperialUserIds.has(key(workout.userId)) ? KG_PER_LB : 1;
    scores.set(key(workout.userId), (scores.get(key(workout.userId)) || 0) + (Number(workout.totalVolume) || 0) * factor);
  });
  return scores;
};

// New best-estimated-max records in the period. The first record of each lift is
// just the first time it was logged, so it isn't counted as progress.
export const scorePrs = ({ records, start }) => {
  const firstAt = new Map();
  records.forEach((record) => {
    if (!isEligible(record)) return;
    const recordKey = `${key(record.userId)}|${record.exerciseName}`;
    const at = toMs(record.achievedAt);
    if (!firstAt.has(recordKey) || at < firstAt.get(recordKey)) firstAt.set(recordKey, at);
  });

  const scores = new Map();
  records.forEach((record) => {
    if (!isEligible(record)) return;
    const at = toMs(record.achievedAt);
    if (start && at < toMs(start)) return;
    if (at === firstAt.get(`${key(record.userId)}|${record.exerciseName}`)) return;
    scores.set(key(record.userId), (scores.get(key(record.userId)) || 0) + 1);
  });
  return scores;
};

// Average % change in estimated max across lifts trained both before and during the
// period (all time: first session vs best ever). Unit-free, so fair across sizes.
export const scoreProgress = ({ workouts, start }) => {
  const startMs = start ? toMs(start) : null;
  const lifts = new Map();

  [...workouts]
    .filter(isEligible)
    .sort((a, b) => toMs(a.date) - toMs(b.date))
    .forEach((workout) => {
      const at = toMs(workout.date);
      (workout.exercises || []).forEach((exercise) => {
        const value = Number(exercise.exerciseBestEstimated1RM) || 0;
        if (!value) return;
        const liftKey = `${key(workout.userId)}|${exercise.exerciseName}`;
        const lift = lifts.get(liftKey) || { userId: key(workout.userId), first: value, best: 0, before: 0, during: 0, sessions: 0 };
        lift.best = Math.max(lift.best, value);
        lift.sessions += 1;
        if (startMs !== null && at < startMs) lift.before = Math.max(lift.before, value);
        if (startMs !== null && at >= startMs) lift.during = Math.max(lift.during, value);
        lifts.set(liftKey, lift);
      });
    });

  const changesByUser = new Map();
  lifts.forEach((lift) => {
    let change = null;
    if (startMs === null && lift.sessions >= 2) change = (lift.best - lift.first) / lift.first;
    if (startMs !== null && lift.before && lift.during) change = (lift.during - lift.before) / lift.before;
    if (change === null) return;
    changesByUser.set(lift.userId, [...(changesByUser.get(lift.userId) || []), change]);
  });

  const scores = new Map();
  changesByUser.forEach((changes, userId) => {
    scores.set(userId, (changes.reduce((sum, change) => sum + change, 0) / changes.length) * 100);
  });
  return scores;
};

// % of bodyweight gained or lost, capped at a healthy weekly pace.
export const scoreWeightChange = ({ entries, start, direction }) => {
  const byUser = new Map();
  entries.forEach((entry) => {
    const weightKg = (Number(entry.weight) || 0) * (entry.unit === "lb" ? KG_PER_LB : 1);
    if (!weightKg) return;
    byUser.set(key(entry.userId), [...(byUser.get(key(entry.userId)) || []), { at: toMs(entry.recordedAt), weightKg }]);
  });

  const scores = new Map();
  byUser.forEach((userEntries, userId) => {
    const sorted = userEntries.sort((a, b) => a.at - b.at);
    const startMs = start ? toMs(start) : null;
    const before = startMs === null ? [] : sorted.filter((entry) => entry.at <= startMs);
    const baseline = before.length ? before[before.length - 1] : sorted.find((entry) => startMs === null || entry.at >= startMs);
    const latest = sorted[sorted.length - 1];
    if (!baseline || latest === baseline) return;

    const changePercent = ((latest.weightKg - baseline.weightKg) / baseline.weightKg) * 100;
    const weeks = Math.max(1, (latest.at - baseline.at) / WEEK_MS);
    const cap = weeks * MAX_WEIGHT_CHANGE_PERCENT_PER_WEEK;
    const signed = direction === "lose" ? -changePercent : changePercent;
    scores.set(userId, Math.min(signed, cap));
  });
  return scores;
};

// Highest first, ties share a place (1, 2, 2, 4). Only people with a positive score appear.
export const rankScores = (scores) => {
  const sorted = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .map(([userId, score]) => ({ userId, score: Math.round(score * 10) / 10 }))
    .sort((a, b) => b.score - a.score);

  let place = 0;
  return sorted.map((entry, index) => {
    if (index === 0 || entry.score !== sorted[index - 1].score) place = index + 1;
    return { ...entry, place };
  });
};
