import { calculateOverallScore } from "./calculateRanks.js";
import { calculateXP } from "./calculateXP.js";
import { getBroadGroupsForMuscle } from "./muscleTaxonomy.js";
import { buildProjection, estimateEta, fitTrend, getGainDecay } from "./projectProgress.js";
import { RANKS, getRankProgress } from "./rankConfig.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const KG_PER_LB = 0.45359237;
const MAX_RANK_CHECKPOINTS = 52;
const MIN_LIFT_SESSIONS = 3;
const MAX_LIFTS = 12;

export const BALANCE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Glutes", "Core"];

const RANGE_DAYS = { month: 30, "90d": 90, "180d": 180, "365d": 365 };

export const getProgressRangeStart = (period, now = new Date()) => {
  const days = RANGE_DAYS[period];
  return days ? new Date(new Date(now).getTime() - days * DAY_MS) : null;
};

const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;
const toMs = (date) => new Date(date).getTime();
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

const weekStartMs = (date) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  const offset = (day.getUTCDay() + 6) % 7;
  return day.getTime() - offset * DAY_MS;
};

const listWeekStarts = (fromMs, toMsValue) => {
  const weeks = [];
  for (let week = weekStartMs(fromMs); week <= toMsValue; week += WEEK_MS) weeks.push(week);
  return weeks;
};

const completedSets = (exercise) => (exercise.sets || []).filter((set) => set.completed !== false).length;

const exerciseBalanceGroups = (exercise) => {
  const groups = new Set();
  (exercise.primaryMuscles || []).forEach((muscle) => {
    getBroadGroupsForMuscle(muscle).forEach((group) => {
      if (BALANCE_GROUPS.includes(group)) groups.add(group);
    });
  });
  return groups;
};

const addSetsByGroup = (totals, workout) => {
  (workout.exercises || []).forEach((exercise) => {
    const sets = completedSets(exercise);
    exerciseBalanceGroups(exercise).forEach((group) => {
      totals[group] = (totals[group] || 0) + sets;
    });
  });
};

const workoutLoad = (workout) =>
  Object.values(workout.muscleLoadSummary || {}).reduce((sum, load) => sum + (Number(load.totalLoad) || 0), 0);

const buildLiftSeries = (workouts) => {
  const series = new Map();
  const compound = new Set();
  workouts.forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const value = Number(exercise.exerciseBestEstimated1RM) || 0;
      if (!value) return;
      const points = series.get(exercise.exerciseName) || [];
      points.push({ date: workout.date, value });
      series.set(exercise.exerciseName, points);
      if (exercise.exerciseType === "compound") compound.add(exercise.exerciseName);
    });
  });
  return { series, compound };
};

const buildLifts = ({ liftSeries, goals, rangeStartMs, now, decay }) => {
  const goalByExercise = new Map(goals.map((goal) => [goal.exerciseName, goal.target]));
  // Lifts with a goal first, then big compound lifts, then everything else; most-logged first within each.
  const priority = (name) => (goalByExercise.has(name) ? 0 : liftSeries.compound.has(name) ? 1 : 2);

  return [...liftSeries.series.entries()]
    .filter(([name, points]) => points.length >= MIN_LIFT_SESSIONS || goalByExercise.has(name))
    .sort((a, b) => priority(a[0]) - priority(b[0]) || b[1].length - a[1].length)
    .slice(0, MAX_LIFTS)
    .map(([exerciseName, points]) => {
      const best = Math.max(...points.map((point) => point.value));
      const trend = fitTrend(points, { now });
      const target = goalByExercise.get(exerciseName);

      return {
        exerciseName,
        sessions: points.length,
        best: roundOne(best),
        latest: roundOne(points[points.length - 1].value),
        history: points
          .filter((point) => rangeStartMs === null || toMs(point.date) >= rangeStartMs)
          .map((point) => ({ date: new Date(point.date).toISOString(), value: roundOne(point.value) })),
        projection: trend
          ? { weeklyGain: roundOne(trend.weeklyGain), points: buildProjection(trend, { decay, now }) }
          : null,
        goal: target ? { target, eta: estimateEta(trend, { decay, target, now, best }) } : null
      };
    });
};

const buildRankJourney = ({ user, workouts, personalRecords, rangeStartMs, now, decay }) => {
  const nowMs = toMs(now);
  const progress = getRankProgress(user.overallRankScore || 0);
  const current = {
    score: Math.round(user.overallRankScore || 0),
    rank: progress.currentRank.name,
    nextRank: progress.nextRank?.name || null,
    pointsToNextRank: progress.pointsToNextRank
  };
  const tiers = RANKS.map((rank) => ({ name: rank.name, minScore: rank.minScore }));

  if (!workouts.length) return { history: [], tiers, current, projection: null, nextRankEta: null, maxEta: null };

  const prsByWorkout = new Map();
  personalRecords.forEach((record) => {
    const key = String(record.workoutId);
    prsByWorkout.set(key, [...(prsByWorkout.get(key) || []), record]);
  });
  const xpByWorkout = workouts.map((workout) => calculateXP({ workout, newPersonalRecords: prsByWorkout.get(String(workout._id)) || [] }));
  const totalWorkoutXp = xpByWorkout.reduce((sum, xp) => sum + xp, 0);
  // Mission and other XP isn't tied to a workout, so spread it proportionally.
  const xpScale = totalWorkoutXp > 0 ? (user.xp || 0) / totalWorkoutXp : 1;

  const firstMs = toMs(workouts[0].date);
  const startMs = Math.max(rangeStartMs ?? firstMs, firstMs);
  const weekEnds = listWeekStarts(startMs, nowMs).map((week) => Math.min(week + WEEK_MS - 1, nowMs));
  const step = Math.ceil(weekEnds.length / MAX_RANK_CHECKPOINTS);
  const checkpoints = weekEnds.filter((_, index) => index % step === 0 || index === weekEnds.length - 1);

  const history = checkpoints.map((checkpoint) => {
    const soFar = workouts.filter((workout) => toMs(workout.date) <= checkpoint);
    const xp =
      xpByWorkout.reduce((sum, value, index) => (toMs(workouts[index].date) <= checkpoint ? sum + value : sum), 0) * xpScale;
    const prsSoFar = personalRecords.filter((record) => toMs(record.achievedAt) <= checkpoint);
    const { overallScore } = calculateOverallScore({ user, workouts: soFar, personalRecords: prsSoFar, xp, now: checkpoint });
    return { date: new Date(checkpoint).toISOString(), score: overallScore, xp: Math.round(xp) };
  });
  if (history.length) {
    history[history.length - 1] = { ...history[history.length - 1], score: current.score, xp: user.xp || 0 };
  }

  const trend = fitTrend(
    history.map((point) => ({ date: point.date, value: point.score })),
    { now, minPoints: 4, minSpanDays: 21 }
  );
  const nextRankMin = progress.nextRank?.minScore;
  const maxMin = RANKS[RANKS.length - 1].minScore;

  return {
    history,
    tiers,
    current,
    projection: trend ? { weeklyGain: Math.round(trend.weeklyGain), points: buildProjection(trend, { decay, now }) } : null,
    nextRankEta: nextRankMin ? estimateEta(trend, { decay, target: nextRankMin, now, best: current.score }) : null,
    maxEta: estimateEta(trend, { decay, target: maxMin, now, best: current.score })
  };
};

const buildConsistency = ({ workouts, rangeStartMs, now }) => {
  const nowMs = toMs(now);
  const inRange = workouts.filter((workout) => rangeStartMs === null || toMs(workout.date) >= rangeStartMs);
  const days = new Map();
  inRange.forEach((workout) => {
    const key = dayKey(workout.date);
    const day = days.get(key) || { date: key, workouts: 0, sets: 0 };
    day.workouts += 1;
    day.sets += (workout.exercises || []).reduce((sum, exercise) => sum + completedSets(exercise), 0);
    days.set(key, day);
  });

  const trainedWeeks = new Set(workouts.map((workout) => weekStartMs(workout.date)));
  const thisWeek = weekStartMs(nowMs);
  // The current week is still in progress, so an empty one doesn't break the streak yet.
  let cursor = trainedWeeks.has(thisWeek) ? thisWeek : thisWeek - WEEK_MS;
  let currentStreakWeeks = 0;
  while (trainedWeeks.has(cursor)) {
    currentStreakWeeks += 1;
    cursor -= WEEK_MS;
  }

  let bestStreakWeeks = 0;
  let run = 0;
  let previous = null;
  [...trainedWeeks].sort((a, b) => a - b).forEach((week) => {
    run = previous !== null && week - previous === WEEK_MS ? run + 1 : 1;
    bestStreakWeeks = Math.max(bestStreakWeeks, run);
    previous = week;
  });

  const firstMs = workouts.length ? toMs(workouts[0].date) : nowMs;
  const spanStart = Math.max(rangeStartMs ?? firstMs, firstMs);
  const spanWeeks = Math.max(1, (nowMs - spanStart) / WEEK_MS);

  return {
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    rangeStart: new Date(spanStart).toISOString(),
    trainingDays: days.size,
    workoutsPerWeek: roundOne(inRange.length / spanWeeks),
    currentStreakWeeks,
    bestStreakWeeks
  };
};

const buildMuscleBalance = ({ workouts, now }) => {
  const nowMs = toMs(now);
  const current = {};
  const previous = {};
  workouts.forEach((workout) => {
    const age = nowMs - toMs(workout.date);
    if (age <= 28 * DAY_MS) addSetsByGroup(current, workout);
    else if (age <= 56 * DAY_MS) addSetsByGroup(previous, workout);
  });

  return BALANCE_GROUPS.map((group) => ({
    group,
    current: roundOne((current[group] || 0) / 4),
    previous: roundOne((previous[group] || 0) / 4)
  }));
};

const buildWeeklySeries = ({ workouts, rangeStartMs, now }) => {
  const nowMs = toMs(now);
  if (!workouts.length) return { weeks: [], setsByWeek: new Map(), loadByWeek: new Map() };

  const firstMs = toMs(workouts[0].date);
  const weeks = listWeekStarts(Math.max(rangeStartMs ?? firstMs, firstMs), nowMs);
  const setsByWeek = new Map();
  const loadByWeek = new Map();
  workouts.forEach((workout) => {
    const week = weekStartMs(workout.date);
    const sets = setsByWeek.get(week) || {};
    addSetsByGroup(sets, workout);
    setsByWeek.set(week, sets);
    loadByWeek.set(week, (loadByWeek.get(week) || 0) + workoutLoad(workout));
  });
  return { weeks, setsByWeek, loadByWeek, firstWeek: weekStartMs(firstMs) };
};

const buildVolumeByMuscle = ({ weeks, setsByWeek }) =>
  weeks.map((week) => {
    const sets = setsByWeek.get(week) || {};
    return BALANCE_GROUPS.reduce(
      (row, group) => ({ ...row, [group]: sets[group] || 0 }),
      { weekStart: new Date(week).toISOString() }
    );
  });

const buildFatigueVsProgress = ({ weeks, loadByWeek, firstWeek, liftSeries, now }) => {
  const nowMs = toMs(now);
  const trackedLifts = [...liftSeries.series.values()].filter((points) => points.length >= MIN_LIFT_SESSIONS);

  return weeks.map((week) => {
    const weekEnd = Math.min(week + WEEK_MS - 1, nowMs);
    const weeksOfHistory = Math.round((week - firstWeek) / WEEK_MS) + 1;
    const windowWeeks = Math.min(4, weeksOfHistory);
    let chronicTotal = 0;
    for (let index = 0; index < windowWeeks; index += 1) chronicTotal += loadByWeek.get(week - index * WEEK_MS) || 0;
    const chronicWeekly = chronicTotal / windowWeeks;
    const acute = loadByWeek.get(week) || 0;
    const loadRatio = weeksOfHistory >= 3 && chronicWeekly > 0 ? roundOne(acute / chronicWeekly) : null;

    const relative = trackedLifts
      .map((points) => {
        const recent = points.filter((point) => toMs(point.date) <= weekEnd && toMs(point.date) > weekEnd - 21 * DAY_MS);
        if (!recent.length) return null;
        return Math.max(...recent.map((point) => point.value)) / points[0].value;
      })
      .filter((value) => value !== null);
    const strengthIndex = relative.length
      ? roundOne((relative.reduce((sum, value) => sum + value, 0) / relative.length) * 100)
      : null;

    return { weekStart: new Date(week).toISOString(), loadRatio, strengthIndex };
  });
};

const buildPrTimeline = ({ personalRecords, weeks }) => {
  const byWeek = new Map(weeks.map((week) => [week, []]));
  const previousByExercise = new Map();

  [...personalRecords]
    .filter((record) => record.recordType === "best_estimated_1rm" && record.value > 0)
    .sort((a, b) => toMs(a.achievedAt) - toMs(b.achievedAt))
    .forEach((record) => {
      const previous = previousByExercise.get(record.exerciseName);
      previousByExercise.set(record.exerciseName, record.value);
      // The first logged session of a lift always counts as a record, so it isn't real progress.
      if (!previous) return;
      const events = byWeek.get(weekStartMs(record.achievedAt));
      if (!events) return;
      events.push({
        exerciseName: record.exerciseName,
        value: roundOne(record.value),
        improvementPercent: roundOne(((record.value - previous) / previous) * 100)
      });
    });

  return weeks.map((week) => {
    const events = byWeek.get(week);
    return {
      weekStart: new Date(week).toISOString(),
      count: events.length,
      highlights: [...events].sort((a, b) => b.improvementPercent - a.improvementPercent).slice(0, 3)
    };
  });
};

const buildBodyweight = ({ bodyweightEntries, rangeStartMs, preferredUnit }) => {
  const toPreferred = (entry) => {
    if (entry.unit === preferredUnit) return entry.weight;
    return preferredUnit === "kg" ? entry.weight * KG_PER_LB : entry.weight / KG_PER_LB;
  };
  const sorted = [...bodyweightEntries].sort((a, b) => toMs(a.recordedAt) - toMs(b.recordedAt));
  const beforeRange = rangeStartMs === null ? [] : sorted.filter((entry) => toMs(entry.recordedAt) < rangeStartMs).slice(-1);
  const inRange = sorted.filter((entry) => rangeStartMs === null || toMs(entry.recordedAt) >= rangeStartMs);

  return [...beforeRange, ...inRange].map((entry) => ({
    date: new Date(entry.recordedAt).toISOString(),
    weight: roundOne(toPreferred(entry))
  }));
};

export const calculateProgressAnalytics = ({
  user,
  workouts = [],
  personalRecords = [],
  bodyweightEntries = [],
  period = "180d",
  now = new Date()
}) => {
  const sortedWorkouts = [...workouts].sort((a, b) => toMs(a.date) - toMs(b.date));
  const rangeStart = getProgressRangeStart(period, now);
  const rangeStartMs = rangeStart ? rangeStart.getTime() : null;
  const decay = getGainDecay(user.trainingExperience);
  const unit = user.preferredUnits === "imperial" ? "lb" : "kg";
  const liftSeries = buildLiftSeries(sortedWorkouts);
  const weekly = buildWeeklySeries({ workouts: sortedWorkouts, rangeStartMs, now });

  return {
    period,
    unit,
    generatedAt: new Date(now).toISOString(),
    lifts: buildLifts({ liftSeries, goals: user.strengthGoals || [], rangeStartMs, now, decay }),
    rankJourney: buildRankJourney({ user, workouts: sortedWorkouts, personalRecords, rangeStartMs, now, decay }),
    consistency: buildConsistency({ workouts: sortedWorkouts, rangeStartMs, now }),
    muscleBalance: buildMuscleBalance({ workouts: sortedWorkouts, now }),
    volumeByMuscle: buildVolumeByMuscle(weekly),
    fatigueVsProgress: weekly.weeks.length ? buildFatigueVsProgress({ ...weekly, liftSeries, now }) : [],
    prTimeline: buildPrTimeline({ personalRecords, weeks: weekly.weeks }),
    bodyweight: buildBodyweight({ bodyweightEntries, rangeStartMs, preferredUnit: unit })
  };
};
