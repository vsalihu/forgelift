import SeverityBadge from "./SeverityBadge.jsx";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

const WeakPointCard = ({ weakPoint }) => {
  const evidence = weakPoint.evidence || {};

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
      {Object.keys(evidence).length ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          {Object.entries(evidence).slice(0, 4).map(([key, value]) => (
            <span className="rounded-full bg-white/10 px-3 py-1" key={key}>
              {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default WeakPointCard;
