import DeloadSeverityBadge from "./DeloadSeverityBadge.jsx";

const PlateauCard = ({ plateau }) => (
  <article className="rounded-lg border border-white/10 bg-black/20 p-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-bold text-white">{plateau.exerciseName}</h3>
        <p className="mt-1 text-sm text-slate-400">{plateau.reason}</p>
      </div>
      <DeloadSeverityBadge severity={plateau.severity} />
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Sessions</p>
        <p className="mt-1 font-bold text-white">{plateau.sessionsAnalysed}</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Estimated 1RM trend</p>
        <p className="mt-1 font-bold text-white">{plateau.estimated1RMTrend?.join(", ") || "-"}</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Volume trend</p>
        <p className="mt-1 font-bold text-white">{plateau.volumeTrend?.join(", ") || "-"}</p>
      </div>
    </div>
  </article>
);

export default PlateauCard;
