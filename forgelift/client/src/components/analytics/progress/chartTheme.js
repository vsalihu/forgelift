// Categorical slots validated for the app's dark panel (#101318): lightness band,
// chroma floor, adjacent colorblind separation and 3:1 contrast all pass.
// Assigned in this fixed order, keyed to the muscle group, never re-ordered by rank.
export const MUSCLE_COLORS = {
  Chest: "#3987e5",
  Back: "#d95926",
  Shoulders: "#199e70",
  Arms: "#c98500",
  Legs: "#d55181",
  Glutes: "#008300",
  Core: "#9085e9"
};

export const ACCENT = "#f97316";
export const MUTED_SERIES = "#64748b";
export const GOOD = "#0ca30c";
export const SURFACE = "#101318";
export const AXIS = "#8b97a8";
export const GRID = "rgba(255, 255, 255, 0.07)";
export const INK = "#e2e8f0";

export const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "rgba(255, 255, 255, 0.12)" }
};

export const tooltipProps = {
  contentStyle: {
    background: "rgba(14, 16, 20, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    boxShadow: "0 20px 40px -16px rgba(0, 0, 0, 0.9)",
    color: "#fff",
    fontSize: 13
  },
  labelStyle: { color: AXIS, marginBottom: 4 },
  itemStyle: { color: INK, padding: 0 },
  cursor: { stroke: "rgba(255, 255, 255, 0.25)", strokeWidth: 1 }
};

export const barTooltipCursor = { fill: "rgba(255, 255, 255, 0.05)" };
