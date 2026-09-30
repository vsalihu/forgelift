export const toTime = (date) => new Date(date).getTime();

export const formatShortDate = (value) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

export const formatLongDate = (value) =>
  new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));

export const formatNumber = (value, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(Number(value) || 0);

export const formatSigned = (value, unit = "") => {
  const number = Number(value) || 0;
  return `${number > 0 ? "+" : ""}${formatNumber(number)}${unit}`;
};

// One plain sentence for an ETA returned by the server's projection.
export const describeEta = (eta, { unit = "", ceilingLabel = "" } = {}) => {
  if (!eta) return "";
  if (eta.status === "reached") return "Reached";
  if (eta.status === "not_enough_data") return "Needs a few more weeks of logs to estimate";
  if (eta.status === "on_pace") {
    if (!eta.weeks) return "Any day now";
    return `~${eta.weeks} week${eta.weeks === 1 ? "" : "s"}, around ${formatShortDate(eta.date)}`;
  }
  const ceiling = eta.ceiling ? ` (your trend levels off near ${formatNumber(eta.ceiling, 0)}${unit}${ceilingLabel})` : "";
  return `Not at your current pace${ceiling}`;
};
