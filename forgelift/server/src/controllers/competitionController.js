import BodyweightEntry from "../models/BodyweightEntry.js";
import PersonalRecord from "../models/PersonalRecord.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import { getBlockedUserIds } from "../utils/blocks.js";
import { getCityById, searchCities } from "../utils/cities.js";
import {
  AGE_GROUPS,
  BOARD_TYPES,
  GENDER_DIVISIONS,
  MIN_AGE,
  PERIODS,
  SCOPES,
  ageThisYear,
  buildBoardKey,
  getAgeGroup,
  getGenderDivision,
  getPeriodStart,
  rankScores,
  scorePrs,
  scoreProgress,
  scoreVolume,
  scoreWeightChange
} from "../utils/competitionLeaderboards.js";

const MAX_ENTRIES = 100;
const WEIGHT_GOALS = ["gain", "lose", "none"];

const describeCompetition = (user, now = new Date()) => {
  const competition = user.competition || {};
  if (!competition.enabled) return { enabled: false };
  return {
    enabled: true,
    cityId: competition.cityId,
    cityName: competition.cityName,
    countryCode: competition.countryCode,
    countryName: competition.countryName,
    birthYear: competition.birthYear,
    ageGroup: getAgeGroup(competition.birthYear, now),
    genderDivision: getGenderDivision(user.gender),
    weightGoal: competition.weightGoal || "none",
    featured: {
      type: competition.featured?.type || "volume",
      scope: competition.featured?.scope || "city",
      period: competition.featured?.period || "month"
    },
    joinedAt: competition.joinedAt
  };
};

const normalizeBoard = (query, viewerCompetition) => {
  const type = BOARD_TYPES.includes(query.type) ? query.type : "volume";
  const scope = SCOPES.includes(query.scope) ? query.scope : "city";
  const period = PERIODS.includes(query.period) ? query.period : "month";
  const ownGender = viewerCompetition.genderDivision || "open";
  const gender = GENDER_DIVISIONS.includes(query.gender) ? query.gender : ownGender;
  const age = query.age === "all" || AGE_GROUPS.some((group) => group.key === query.age) ? query.age : viewerCompetition.ageGroup || "all";
  return { type, scope, period, gender, age };
};

const buildCandidateFilter = ({ board, viewerCompetition, blockedIds, now }) => {
  const filter = { "competition.enabled": true };
  if (board.scope === "city") filter["competition.cityId"] = viewerCompetition.cityId;
  if (board.scope === "country") filter["competition.countryCode"] = viewerCompetition.countryCode;
  if (board.gender === "men") filter.gender = "male";
  if (board.gender === "women") filter.gender = "female";
  if (board.age !== "all") {
    const group = AGE_GROUPS.find((item) => item.key === board.age);
    const year = new Date(now).getUTCFullYear();
    filter["competition.birthYear"] = { $gte: year - group.max, $lte: year - group.min };
  }
  if (board.type === "weight_gain") filter["competition.weightGoal"] = "gain";
  if (board.type === "weight_loss") filter["competition.weightGoal"] = "lose";
  if (blockedIds.length) filter._id = { $nin: blockedIds };
  return filter;
};

const computeScores = async ({ board, userIds, imperialUserIds, start }) => {
  if (!userIds.length) return new Map();
  const eligible = { leaderboardEligible: { $ne: false } };

  if (board.type === "volume") {
    const workouts = await Workout.find({ userId: { $in: userIds }, ...eligible, ...(start ? { date: { $gte: start } } : {}) })
      .select("userId date totalVolume leaderboardEligible")
      .lean();
    return scoreVolume({ workouts, start, imperialUserIds });
  }

  if (board.type === "prs") {
    const records = await PersonalRecord.find({ userId: { $in: userIds }, recordType: "best_estimated_1rm", ...eligible })
      .select("userId exerciseName achievedAt leaderboardEligible")
      .lean();
    return scorePrs({ records, start });
  }

  if (board.type === "progress") {
    const workouts = await Workout.find({ userId: { $in: userIds }, ...eligible })
      .select("userId date leaderboardEligible exercises.exerciseName exercises.exerciseBestEstimated1RM")
      .lean();
    return scoreProgress({ workouts, start });
  }

  const entries = await BodyweightEntry.find({ userId: { $in: userIds } }).select("userId weight unit recordedAt").lean();
  return scoreWeightChange({ entries, start, direction: board.type === "weight_gain" ? "gain" : "lose" });
};

const buildLeaderboard = async ({ viewer, query, now = new Date() }) => {
  const viewerCompetition = describeCompetition(viewer, now);
  const board = normalizeBoard(query, viewerCompetition);
  const blockedIds = await getBlockedUserIds(viewer._id);
  const candidates = await User.find(buildCandidateFilter({ board, viewerCompetition, blockedIds, now }))
    .select("name username currentOverallRank preferredUnits gender competition.cityName competition.countryName")
    .lean();

  const start = getPeriodStart(board.period, now);
  const imperialUserIds = new Set(candidates.filter((user) => user.preferredUnits === "imperial").map((user) => String(user._id)));
  const scores = await computeScores({ board, userIds: candidates.map((user) => user._id), imperialUserIds, start });
  const ranked = rankScores(scores);
  const usersById = new Map(candidates.map((user) => [String(user._id), user]));

  const toEntry = (entry) => {
    const user = usersById.get(entry.userId);
    return {
      place: entry.place,
      score: entry.score,
      userId: entry.userId,
      name: user.name,
      username: user.username,
      rank: user.currentOverallRank || "Copper",
      cityName: user.competition?.cityName || "",
      countryName: user.competition?.countryName || "",
      isMe: entry.userId === String(viewer._id)
    };
  };

  const mine = ranked.find((entry) => entry.userId === String(viewer._id));
  const viewerInDivision = candidates.some((user) => String(user._id) === String(viewer._id));

  return {
    board: {
      ...board,
      regionName: board.scope === "city" ? viewerCompetition.cityName : board.scope === "country" ? viewerCompetition.countryName : "World",
      periodStart: start ? start.toISOString() : null,
      key: buildBoardKey({
        ...board,
        regionId: board.scope === "city" ? viewerCompetition.cityId : viewerCompetition.countryCode,
        periodStart: start
      })
    },
    totalCompetitors: candidates.length,
    rankedCount: ranked.length,
    entries: ranked.slice(0, MAX_ENTRIES).map(toEntry),
    me: mine ? toEntry(mine) : null,
    viewerInDivision,
    generatedAt: new Date(now).toISOString()
  };
};

const requireCompetitor = (req, res) => {
  if (!req.user.competition?.enabled) {
    res.status(403).json({ message: "Join competitions first to see leaderboards." });
    return false;
  }
  return true;
};

export const searchCompetitionCities = async (req, res) => {
  return res.json({ cities: searchCities(req.query.q, 10) });
};

export const getMyCompetition = async (req, res) => {
  return res.json({ competition: describeCompetition(req.user) });
};

export const joinOrUpdateCompetition = async (req, res) => {
  try {
    const { cityId, birthYear, weightGoal, confirmAdult } = req.body;
    const city = getCityById(cityId);
    const year = Number(birthYear);
    const currentYear = new Date().getUTCFullYear();

    if (!city) {
      return res.status(400).json({ message: "Choose your city from the list." });
    }

    if (!Number.isInteger(year) || year < currentYear - 110 || year > currentYear) {
      return res.status(400).json({ message: "Enter a valid birth year." });
    }

    if (ageThisYear(year) < MIN_AGE || confirmAdult !== true) {
      return res.status(400).json({ message: `Competitions are for people aged ${MIN_AGE} and over.` });
    }

    if (weightGoal !== undefined && !WEIGHT_GOALS.includes(weightGoal)) {
      return res.status(400).json({ message: "Choose a valid weight goal." });
    }

    const previous = req.user.competition || {};
    req.user.competition = {
      ...(previous.toObject ? previous.toObject() : previous),
      enabled: true,
      cityId: city.cityId,
      cityName: city.name,
      countryCode: city.countryCode,
      countryName: city.countryName,
      birthYear: year,
      weightGoal: weightGoal || previous.weightGoal || "none",
      joinedAt: previous.enabled ? previous.joinedAt : new Date()
    };
    await req.user.save();
    return res.json({ competition: describeCompetition(req.user) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save competition settings.", error: error.message });
  }
};

export const leaveCompetition = async (req, res) => {
  try {
    req.user.competition.enabled = false;
    req.user.competition.lastSeenPlace = undefined;
    req.user.competition.lastSeenBoardKey = undefined;
    await req.user.save();
    return res.json({ competition: describeCompetition(req.user) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to leave competitions.", error: error.message });
  }
};

export const setFeaturedBoard = async (req, res) => {
  try {
    if (!requireCompetitor(req, res)) return undefined;
    const { type, scope, period } = req.body;
    if (!BOARD_TYPES.includes(type) || !SCOPES.includes(scope) || !PERIODS.includes(period)) {
      return res.status(400).json({ message: "Choose a valid leaderboard." });
    }
    req.user.competition.featured = { type, scope, period };
    await req.user.save();
    return res.json({ competition: describeCompetition(req.user) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to pin leaderboard.", error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    if (!requireCompetitor(req, res)) return undefined;
    return res.json({ leaderboard: await buildLeaderboard({ viewer: req.user, query: req.query }) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load leaderboard.", error: error.message });
  }
};

// Your place on your pinned board in your own division, plus the place you last saw,
// so the app can show "you moved up/down" once.
export const getStanding = async (req, res) => {
  try {
    if (!req.user.competition?.enabled) return res.json({ standing: { enabled: false } });

    const featured = describeCompetition(req.user).featured;
    const leaderboard = await buildLeaderboard({ viewer: req.user, query: featured });
    const { lastSeenPlace, lastSeenBoardKey } = req.user.competition;

    return res.json({
      standing: {
        enabled: true,
        board: leaderboard.board,
        place: leaderboard.me?.place || null,
        score: leaderboard.me?.score || 0,
        rankedCount: leaderboard.rankedCount,
        previousPlace: lastSeenBoardKey === leaderboard.board.key ? lastSeenPlace ?? null : null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load your standing.", error: error.message });
  }
};

export const markStandingSeen = async (req, res) => {
  try {
    if (!requireCompetitor(req, res)) return undefined;
    const place = req.body.place === null ? null : Number(req.body.place);
    if (place !== null && (!Number.isInteger(place) || place < 1)) {
      return res.status(400).json({ message: "Invalid place." });
    }
    req.user.competition.lastSeenPlace = place ?? undefined;
    req.user.competition.lastSeenBoardKey = String(req.body.boardKey || "").slice(0, 200);
    await req.user.save();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save standing.", error: error.message });
  }
};
