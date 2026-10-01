import StatusChip from "../advice/StatusChip.jsx";
import { formatTrend, quadrantFor } from "./quadrants.js";

const LoadGauge = ({ acwr }) => {
  const position = Math.min(100, Math.max(0, ((acwr || 0) / 2) * 100));
  return (
    <div aria-hidden="true" className="relative mt-1.5 h-1.5 rounded-full bg-white/[0.08]">
      <div className="absolute inset-y-0 rounded-full bg-emerald-400/30" style={{ left: "40%", width: "25%" }} />
      <span className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: `${position}%` }} />
    </div>
  );
};

const TrainingLoadRow = ({ item }) => {
  const meta = quadrantFor(item.quadrant);
  const trend = item.strengthTrendPercent;
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white">{item.muscleGroup}</h3>
        <StatusChip icon={meta.icon} tone={meta.tone}>
          {meta.label}
        </StatusChip>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{item.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <dt className="text-xs text-zinc-500">Load ratio</dt>
          <dd className="text-sm font-bold tabular-nums text-zinc-100">
            {item.acwr ?? "–"} <span className="font-normal text-zinc-500">{item.acwrStatus}</span>
          </dd>
          <dd>
            <LoadGauge acwr={item.acwr} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-zinc-500">Strength trend</dt>
          <dd className={`text-sm font-bold tabular-nums ${trend > 0 ? "text-emerald-300" : trend < 0 ? "text-red-300" : "text-zinc-100"}`}>
            {formatTrend(trend)} <span className="font-normal text-zinc-500">{item.strengthDirection}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
};

export default TrainingLoadRow;
