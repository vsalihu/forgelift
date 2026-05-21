import DeloadSeverityBadge from "./DeloadSeverityBadge.jsx";

const fatigueSeverity = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical"
};

const FatigueSummaryCard = ({ fatigue }) => {
  const level = fatigue?.fatigueLevel || "Low";

  return (
    <section className="metal-panel rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Fatigue</p>
          <h2 className="mt-1 text-xl font-black text-white">{level} accumulation</h2>
        </div>
        <DeloadSeverityBadge severity={fatigueSeverity[level]} />
      </div>
      {fatigue?.affectedMuscles?.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {fatigue.affectedMuscles.map((muscle) => (
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200" key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      ) : null}
      {fatigue?.reasons?.length ? (
        <ul className="space-y-2 text-sm text-slate-300">
          {fatigue.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No strong fatigue accumulation pattern detected.</p>
      )}
    </section>
  );
};

export default FatigueSummaryCard;
