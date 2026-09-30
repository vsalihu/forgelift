import SeverityBadge from "./SeverityBadge.jsx";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

const wholeNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value) || 0);
const oneDecimal = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
const signedPercent = (value) => `${Number(value) > 0 ? "+" : ""}${oneDecimal(value)}%`;

const evidenceFormats = {
  currentRank: ["Current rank", String],
  strongestRank: ["Best muscle rank", String],
  gap: ["Ranks behind", wholeNumber],
  directLoad: ["Direct load", wholeNumber],
  indirectLoad: ["Indirect load", wholeNumber],
  weightedLoad: ["Total load", wholeNumber],
  pushPullRatio: ["Push/pull", (value) => `${oneDecimal(value)}x`],
  upperLowerRatio: ["Upper/lower", (value) => `${oneDecimal(value)}x`],
  frontRearRatio: ["Front/rear", (value) => `${oneDecimal(value)}x`],
  daysSinceDirectTraining: ["Days since trained", wholeNumber],
  acwr: ["Load ratio", oneDecimal],
  acwrStatus: ["Load status", String],
  strengthTrendPercent: ["Strength trend", signedPercent],
  workoutsLast7Days: ["Workouts this week", wholeNumber],
  highRpeSessions: ["Very hard sessions", wholeNumber],
  directGluteLoad: ["Direct glute load", wholeNumber],
  workoutCount: ["Workouts logged", wholeNumber],
  neglectedCompounds: ["Missing lifts", (value) => value.join(", ")]
};

const humanizeKey = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

// Turns the raw evidence object into short readable chips, skipping values
// that can't be shown as a single tidy figure (nested objects, empty lists).
const buildEvidenceChips = (evidence = {}) =>
  Object.entries(evidence)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .filter(([, value]) => typeof value !== "object" || (Array.isArray(value) && value.length && value.every((item) => typeof item === "string")))
    .map(([key, value]) => {
      const [label, format] = evidenceFormats[key] || [humanizeKey(key), (raw) => (typeof raw === "number" ? oneDecimal(raw) : String(raw))];
      return { key, text: `${label}: ${format(value)}` };
    })
    .slice(0, 4);

const WeakPointCard = ({ weakPoint }) => {
  const chips = buildEvidenceChips(weakPoint.evidence);

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
      {chips.length ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          {chips.map((chip) => (
            <span className="rounded-full bg-white/10 px-3 py-1" key={chip.key}>
              {chip.text}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default WeakPointCard;
