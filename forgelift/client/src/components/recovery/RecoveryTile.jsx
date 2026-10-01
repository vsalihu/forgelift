import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { getBroadMuscleImage, getMuscleImage } from "../../utils/muscleImages.js";
import { tone as getTone } from "../advice/tones.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

export const recoveryTone = (score) => (score >= 80 ? "good" : score >= 60 ? "caution" : score >= 40 ? "serious" : "critical");

const readyText = (date) => {
  if (!date) return null;
  const when = new Date(date);
  if (when.getTime() <= Date.now()) return "Ready for heavy work now";
  const sameDay = when.toDateString() === new Date().toDateString();
  const day = sameDay ? "today" : when.toLocaleDateString("en-US", { weekday: "short" });
  return `Heavy work from ${day} ${when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

const RecoveryTile = ({ recovery }) => {
  const [open, setOpen] = useState(false);
  const score = Math.round(recovery.score || 0);
  const t = getTone(recoveryTone(score));
  const image = getMuscleImage(recovery.muscleGroup) || getBroadMuscleImage(recovery.muscleGroup);
  const detailsId = `recovery-${recovery.muscleGroup.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4">
      <div className="flex items-center gap-3">
        {image ? <img alt="" className="h-12 w-12 shrink-0 rounded-2xl bg-black/30 object-contain p-1" height="48" src={image} width="48" /> : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white">{recovery.muscleGroup}</h3>
          <p className={`text-sm font-semibold ${t.text}`}>{recovery.status}</p>
        </div>
        <span className="font-display shrink-0 text-3xl tabular-nums text-white">
          {score}
          <span className="text-base text-zinc-500">%</span>
        </span>
      </div>
      <div aria-label={`${recovery.muscleGroup} ${score}% recovered`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={score} className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{readyText(recovery.nextRecommendedTrainingTime) || `${recovery.restRecommendationHours || 0}h rest suggested`}</p>

      <button
        aria-controls={detailsId}
        aria-expanded={open}
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        Why
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-2 space-y-3" id={detailsId}>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Direct", recovery.lastDirectLoad],
              ["Indirect", recovery.lastIndirectLoad],
              ["Stabiliser", recovery.lastStabiliserLoad]
            ].map(([label, value]) => (
              <div className="rounded-xl bg-black/25 px-2 py-2" key={label}>
                <dt className="text-[0.7rem] text-zinc-500">{label}</dt>
                <dd className="text-sm font-bold tabular-nums text-zinc-100">{formatNumber(value)}</dd>
              </div>
            ))}
          </dl>
          {recovery.reasons?.length ? (
            <ul className="space-y-1.5 text-sm leading-6 text-zinc-400">
              {recovery.reasons.slice(0, 4).map((reason) => (
                <li className="flex gap-2" key={reason}>
                  <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default RecoveryTile;
