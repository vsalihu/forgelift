import { DetrainingIcon, FlameIcon, RepeatIcon, TrendingDownIcon, TrendingUpIcon } from "../icons/featureIcons.jsx";

// Each training-load quadrant as a status: tone (colour + label), icon and what to do.
export const QUADRANTS = {
  "Fatigued Without Gains": { tone: "critical", icon: TrendingDownIcon, label: "Fatigued, no gains", order: 0 },
  Overreaching: { tone: "caution", icon: FlameIcon, label: "Overreaching", order: 1 },
  "Real Progress": { tone: "good", icon: TrendingUpIcon, label: "Real progress", order: 2 },
  Maintaining: { tone: "neutral", icon: RepeatIcon, label: "Maintaining", order: 3 },
  Detraining: { tone: "info", icon: DetrainingIcon, label: "Detraining", order: 4 }
};

export const quadrantFor = (name) => QUADRANTS[name] || { tone: "neutral", icon: RepeatIcon, label: name || "Not enough data", order: 9 };

export const formatTrend = (value) => (value === null || value === undefined ? "–" : `${value > 0 ? "+" : ""}${value}%`);
