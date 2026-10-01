import { ArrowRight } from "lucide-react";
import StatusChip from "../advice/StatusChip.jsx";
import { severityTone } from "../advice/tones.js";
import { ErrorIcon, SuccessIcon } from "../icons/featureIcons.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const TYPE_LABELS = {
  weight_deload: "Lighter weight",
  volume_deload: "Fewer sets",
  intensity_deload: "Easier effort",
  rest_deload: "Extra rest",
  technique_reset: "Technique reset",
  full_body_deload: "Full-body deload"
};

const Change = ({ label, from, to, unit = "" }) =>
  from || to ? (
    <div className="min-w-0 rounded-2xl bg-black/25 px-3 py-2.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-bold tabular-nums">
        <span className="text-zinc-400">
          {formatNumber(from)}
          {unit}
        </span>
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-orange-300" />
        <span className="text-white">
          {formatNumber(to)}
          {unit}
        </span>
      </dd>
    </div>
  ) : null;

const DeloadCard = ({ recommendation, onStatusChange }) => {
  const plan = recommendation.plan || {};
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold capitalize text-zinc-500">{recommendation.scope?.replaceAll("_", " ") || "Deload"}</p>
          <h3 className="font-display mt-0.5 break-words text-xl leading-tight text-white">{recommendation.exerciseName || recommendation.muscleGroup || "Full body"}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusChip tone={severityTone(recommendation.severity)}>{recommendation.severity || "Low"}</StatusChip>
          <StatusChip>{TYPE_LABELS[recommendation.recommendationType] || recommendation.recommendationType?.replaceAll("_", " ")}</StatusChip>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {recommendation.reductionPercentage ? (
          <p className="font-display text-4xl leading-none tabular-nums text-white">
            −{formatNumber(recommendation.reductionPercentage)}
            <span className="text-xl text-zinc-400">%</span>
          </p>
        ) : null}
        <p className="text-sm text-zinc-400">
          {recommendation.reductionPercentage ? "easier" : ""}
          {recommendation.recommendedRestDays ? `${recommendation.reductionPercentage ? " · " : ""}${recommendation.recommendedRestDays} rest ${recommendation.recommendedRestDays === 1 ? "day" : "days"}` : ""}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Change from={recommendation.currentWeight} label="Weight" to={recommendation.recommendedWeight} unit="kg" />
        <Change from={recommendation.currentVolume} label="Volume" to={recommendation.recommendedVolume} />
      </dl>

      <p className="mt-4 text-sm leading-6 text-zinc-300">{recommendation.reason}</p>

      {plan.instructions?.length ? (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-white">The plan</h4>
          <ol className="mt-2 space-y-2">
            {plan.instructions.map((step, index) => (
              <li className="flex gap-3 text-sm leading-6 text-zinc-300" key={step}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-[0.7rem] font-black text-orange-200">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {plan.nextSessionTarget ? (
        <p className="mt-3 rounded-2xl border border-forge-ember/20 bg-forge-ember/[0.06] px-3.5 py-2.5 text-sm text-orange-100">
          <span className="font-bold">Next session:</span> {plan.nextSessionTarget}
        </p>
      ) : null}
      {plan.rebuildStrategy ? <p className="mt-2 text-sm leading-6 text-zinc-500">After: {plan.rebuildStrategy}</p> : null}

      {recommendation.warnings?.length ? (
        <ul className="mt-3 space-y-1 rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-3 text-sm text-red-100">
          {recommendation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {recommendation.status === "active" && onStatusChange ? (
        <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.06] pt-3">
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-zinc-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => onStatusChange(recommendation._id, "ignored")}
          >
            <ErrorIcon className="h-4 w-4" />
            Skip
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => onStatusChange(recommendation._id, "completed")}
          >
            <SuccessIcon className="h-4 w-4" />
            Deload done
          </button>
        </div>
      ) : null}
    </article>
  );
};

export default DeloadCard;
