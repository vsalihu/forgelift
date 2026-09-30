import SeverityBadge from "./SeverityBadge.jsx";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

const wholeNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);
const oneDecimal = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
const signedPercent = (value) => `${Number(value) > 0 ? "+" : ""}${oneDecimal(value)}%`;

const describeRatio = (ratio, moreLabel, lessLabel) => {
  const value = Number(ratio) || 0;
  if (value > 1.25) return `You do about ${oneDecimal(value)}x more ${moreLabel} than ${lessLabel}.`;
  if (value < 0.8) return `You do about ${oneDecimal(1 / (value || 1))}x more ${lessLabel} than ${moreLabel}.`;
  return `That is fairly balanced.`;
};

const describeLoadRatio = (value) => {
  const ratio = Number(value) || 0;
  if (ratio > 1.3) return `Your last 7 days were about ${oneDecimal(ratio)}x your usual weekly amount. A sudden jump like this raises fatigue and injury risk.`;
  if (ratio < 0.8) return `Your last 7 days were well below your usual weekly amount, so this muscle is getting less work than normal.`;
  return `Your last 7 days were close to your usual weekly amount, which is the safe zone.`;
};

// label + how to show the value + a beginner-friendly explanation of what it means.
const evidenceDetails = {
  directLoad: {
    label: "Direct load",
    format: wholeNumber,
    explain: () =>
      "Work aimed straight at this muscle over the last 4 weeks. Load is roughly weight x reps, adjusted for how hard the sets were, so a bigger number means more direct training."
  },
  indirectLoad: {
    label: "Indirect load",
    format: wholeNumber,
    explain: () =>
      "Work this muscle did as a helper in other exercises, like triceps during bench press. It gets tired from this, but it is not trained as well as with direct work."
  },
  weightedLoad: {
    label: "Total load",
    format: wholeNumber,
    explain: () => "All the work this muscle got in the last 4 weeks, with helper work counted at a lower value."
  },
  pushPullRatio: {
    label: "Push vs pull",
    format: (value) => `${oneDecimal(value)}x`,
    explain: (value) =>
      `Pushing (chest, shoulders, triceps) divided by pulling (back, biceps). 1x is balanced. ${describeRatio(value, "pushing", "pulling")}`
  },
  upperLowerRatio: {
    label: "Upper vs lower body",
    format: (value) => `${oneDecimal(value)}x`,
    explain: (value) =>
      `Upper body work divided by leg and hip work. 1x is balanced. ${describeRatio(value, "upper body work", "lower body work")}`
  },
  frontRearRatio: {
    label: "Front vs rear",
    format: (value) => `${oneDecimal(value)}x`,
    explain: (value) =>
      `Front of the body (chest, quads) divided by the back of the body (back, hamstrings, glutes). 1x is balanced. ${describeRatio(value, "front work", "rear work")}`
  },
  daysSinceDirectTraining: {
    label: "Days since trained",
    format: wholeNumber,
    explain: () => "Days since you last trained this muscle directly. Most muscles do best when trained about every 3 to 7 days."
  },
  acwr: {
    label: "Load ratio",
    format: oneDecimal,
    explain: (value) =>
      `Compares your last 7 days of training to your usual week. 1.0 is normal, under 0.8 means you backed off, over 1.3 is a big jump. ${describeLoadRatio(value)}`
  },
  strengthTrendPercent: {
    label: "Strength trend",
    format: signedPercent,
    explain: (value) =>
      Number(value) > 1
        ? "How much your estimated max on this muscle's exercises has grown in about the last 2 months. It is going up."
        : Number(value) < -1
          ? "How much your estimated max on this muscle's exercises has changed in about the last 2 months. It is going down."
          : "How much your estimated max on this muscle's exercises has changed in about the last 2 months. Around 0% means no real gains lately."
  },
  workoutsLast7Days: {
    label: "Workouts this week",
    format: wholeNumber,
    explain: () => "How many workouts you logged in the last 7 days."
  },
  highRpeSessions: {
    label: "Very hard sessions",
    format: wholeNumber,
    explain: () => "Recent sessions you rated 9 or 10 out of 10 for effort. Too many in a row wears you down."
  },
  directGluteLoad: {
    label: "Direct glute load",
    format: wholeNumber,
    explain: () => "Work aimed straight at your glutes recently. Your goal needs this to be higher."
  },
  workoutCount: {
    label: "Workouts logged",
    format: wholeNumber,
    explain: () => "How many workouts ForgeLift has to learn from so far. More workouts means better advice."
  },
  neglectedCompounds: {
    label: "Missing lifts",
    format: (value) => value.join(", "),
    explain: () => "Big multi-muscle lifts your goal relies on that you have not logged recently."
  }
};

const humanizeKey = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

const isShowable = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  (typeof value !== "object" || (Array.isArray(value) && value.length && value.every((item) => typeof item === "string")));

const buildRankGapItem = (evidence) => ({
  key: "rankGap",
  label: "Rank gap",
  value: `${evidence.currentRank} vs ${evidence.strongestRank}`,
  explain: `This muscle's rank is ${wholeNumber(evidence.gap)} level${Number(evidence.gap) === 1 ? "" : "s"} below your best muscle. Your overall rank is the average of all your muscles, so the weakest ones pull it down.`
});

// Turns the raw evidence object into labelled figures with a plain-language meaning,
// skipping values that can't be shown as one tidy figure (nested objects, empty lists).
const buildEvidenceItems = (evidence = {}) => {
  const items = [];
  const consumed = new Set();

  if (evidence.currentRank && evidence.strongestRank && evidence.gap !== undefined) {
    items.push(buildRankGapItem(evidence));
    ["currentRank", "strongestRank", "gap"].forEach((key) => consumed.add(key));
  }

  Object.entries(evidence).forEach(([key, value]) => {
    if (consumed.has(key) || !isShowable(value)) return;

    if (key === "acwrStatus" && evidence.acwr !== undefined) return;

    const details = evidenceDetails[key];
    if (!details) {
      items.push({ key, label: humanizeKey(key), value: typeof value === "number" ? oneDecimal(value) : String(value), explain: "" });
      return;
    }

    const suffix = key === "acwr" && evidence.acwrStatus ? ` (${evidence.acwrStatus})` : "";
    items.push({ key, label: details.label, value: `${details.format(value)}${suffix}`, explain: details.explain(value) });
  });

  return items.slice(0, 4);
};

const WeakPointCard = ({ weakPoint }) => {
  const items = buildEvidenceItems(weakPoint.evidence);

  return (
    <article className="metal-panel rounded-lg p-5 shadow-metal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-forge-steel">{formatDate(weakPoint.detectedAt || weakPoint.createdAt)}</p>
          <h2 className="mt-1 text-xl font-black text-white">{weakPoint.title}</h2>
        </div>
        <SeverityBadge severity={weakPoint.severity} />
      </div>
      {weakPoint.muscleGroup ? (
        <p className="mb-3 text-sm font-semibold text-forge-copper">{weakPoint.muscleGroup}</p>
      ) : null}
      <p className="text-sm leading-6 text-slate-300">{weakPoint.message}</p>
      <p className="mt-3 rounded-md bg-black/25 p-3 text-sm leading-6 text-slate-300">{weakPoint.recommendation}</p>
      {items.length ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">What the numbers mean</p>
          <dl className="space-y-3">
            {items.map((item) => (
              <div key={item.key}>
                <dt className="text-sm font-bold text-slate-100">
                  {item.label}: <span className="text-forge-copper">{item.value}</span>
                </dt>
                {item.explain ? <dd className="mt-1 text-xs leading-5 text-slate-400">{item.explain}</dd> : null}
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </article>
  );
};

export default WeakPointCard;
