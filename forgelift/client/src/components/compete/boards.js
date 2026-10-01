export const BOARD_TYPES = [
  { value: "volume", label: "Volume", explain: "Total weight lifted (weight x reps), converted to kg so everyone is compared fairly." },
  { value: "prs", label: "PRs", explain: "New personal records. Your very first session of a lift doesn't count." },
  { value: "progress", label: "Progress", explain: "How much stronger your lifts got compared with before this period, in %. The fairest board: size and experience don't decide it." },
  { value: "weight_loss", label: "Weight loss", explain: "% of bodyweight lost from your weigh-ins. Capped at 1% per week so crash diets don't win." },
  { value: "weight_gain", label: "Weight gain", explain: "% of bodyweight gained from your weigh-ins. Capped at 1% per week so only steady gains count." }
];

export const SCOPE_OPTIONS = [
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "world", label: "World" }
];

export const PERIOD_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" }
];

export const GENDER_OPTIONS = [
  { value: "open", label: "Open (everyone)" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" }
];

export const AGE_OPTIONS = [
  { value: "all", label: "All ages" },
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" }
];

export const WEIGHT_GOAL_OPTIONS = [
  { value: "none", label: "Not competing on bodyweight" },
  { value: "lose", label: "Losing weight" },
  { value: "gain", label: "Gaining weight" }
];

const LB_PER_KG = 1 / 0.453592;
const number = (value, digits = 0) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value || 0);

export const formatScore = (type, score, unit = "kg") => {
  if (type === "volume") return unit === "lb" ? `${number(score * LB_PER_KG)} lb` : `${number(score)} kg`;
  if (type === "prs") return `${number(score)} PR${score === 1 ? "" : "s"}`;
  if (type === "progress") return `+${number(score, 1)}%`;
  if (type === "weight_loss") return `${number(score, 1)}% lost`;
  return `${number(score, 1)}% gained`;
};

const label = (options, value) => options.find((option) => option.value === value)?.label || value;

export const describeDivision = (gender, age) => {
  const genderLabel = gender === "open" ? "Open" : label(GENDER_OPTIONS, gender);
  return age === "all" ? genderLabel : `${genderLabel} ${age}`;
};

export const describePeriod = (period) =>
  ({ week: "this week", month: "this month", year: "this year", all: "all time" })[period] || period;

export const describeBoard = (board) =>
  `${label(BOARD_TYPES, board.type)} ${describePeriod(board.period)} · ${board.regionName} · ${describeDivision(board.gender, board.age)}`;
