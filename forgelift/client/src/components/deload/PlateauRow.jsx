import StatusChip from "../advice/StatusChip.jsx";
import { severityTone } from "../advice/tones.js";
import Sparkline from "./Sparkline.jsx";

const PlateauRow = ({ plateau }) => (
  <article className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="min-w-0 break-words text-base font-bold text-white">{plateau.exerciseName}</h3>
      <StatusChip tone={severityTone(plateau.severity)}>{plateau.severity || "Low"}</StatusChip>
    </div>
    <p className="mt-1.5 text-sm leading-6 text-zinc-400">{plateau.reason}</p>
    <dl className="mt-3 grid grid-cols-2 gap-3">
      <div className="min-w-0">
        <dt className="text-xs text-zinc-500">Estimated 1RM</dt>
        <dd className="mt-1">
          <Sparkline color="#fb923c" label="Estimated 1RM by session" values={plateau.estimated1RMTrend} />
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-zinc-500">Volume</dt>
        <dd className="mt-1">
          <Sparkline color="#a1a1aa" label="Volume by session" values={plateau.volumeTrend} />
        </dd>
      </div>
    </dl>
    <p className="mt-2 text-xs text-zinc-500">Last {plateau.sessionsAnalysed || 0} sessions</p>
  </article>
);

export default PlateauRow;
