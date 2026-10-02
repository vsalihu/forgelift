import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import StatusChip from "../advice/StatusChip.jsx";
import { ErrorIcon, SuccessIcon, TrendingUpIcon } from "../icons/featureIcons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { DeloadIcon } from "../icons/navIcons.jsx";
import { overloadType } from "./overloadTypes.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const OverloadCard = ({ recommendation, activeDeload, index = 0, onStatusChange }) => {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const meta = overloadType(recommendation.recommendationType);
  const delta = (recommendation.recommendedWeight || 0) - (recommendation.currentWeight || 0);
  const hasWeights = recommendation.currentWeight > 0 || recommendation.recommendedWeight > 0;
  const contexts = [
    ["Goal", recommendation.goalPathContext],
    ["Recovery", recommendation.recoveryContext],
    ["Weak point", recommendation.weakPointContext]
  ].filter(([, text]) => text);
  const detailsId = `overload-${recommendation._id}`;
  const unit = recommendation.unit || (user?.preferredUnits === "imperial" ? "lb" : "kg");
  // Older recommendations say "reps" in the target already; don't double it.
  const repTarget = recommendation.recommendedRepTarget
    ? /rep/i.test(recommendation.recommendedRepTarget)
      ? recommendation.recommendedRepTarget
      : `${recommendation.recommendedRepTarget} reps`
    : "";
  const target = repTarget && recommendation.recommendedSets && !/set/i.test(repTarget) ? `${recommendation.recommendedSets} sets · ${repTarget}` : repTarget;
  // The deload banner already says this.
  const warnings = (recommendation.warnings || []).filter((warning) => !(activeDeload && /deload recommendation active/i.test(warning)));

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      {activeDeload ? (
        <div className="mb-4 flex gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/[0.08] p-3 text-sm text-red-100">
          <DeloadIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            A deload is running for this. Train lighter until it's done.{" "}
            <Link className="font-bold underline underline-offset-2" to="/deload">
              See the deload
            </Link>
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display break-words text-xl leading-tight text-white">{recommendation.exerciseName}</h3>
          {recommendation.muscleGroups?.length ? <p className="mt-1 truncate text-sm text-zinc-500">{recommendation.muscleGroups.join(" · ")}</p> : null}
        </div>
        <StatusChip icon={meta.icon} tone={meta.tone}>
          {meta.label}
        </StatusChip>
      </div>

      {hasWeights ? (
        delta || !recommendation.targetReps ? (
          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1 rounded-2xl bg-black/25 px-4 py-3">
            {delta ? (
              <>
                <span className="text-lg font-bold tabular-nums text-zinc-400">
                  {formatNumber(recommendation.currentWeight)} {unit}
                </span>
                <ArrowRight aria-hidden="true" className="mb-1.5 h-4 w-4 text-orange-300" />
              </>
            ) : null}
            <span className="font-display text-3xl leading-none tabular-nums text-white">
              {formatNumber(recommendation.recommendedWeight)}
              <span className="ml-1 text-lg text-zinc-400">{unit}</span>
            </span>
            {delta ? (
              <span className={`mb-0.5 text-sm font-bold tabular-nums ${delta > 0 ? "text-emerald-300" : "text-amber-200"}`}>
                {delta > 0 ? "+" : ""}
                {formatNumber(delta)} {unit}
              </span>
            ) : (
              <span className="mb-0.5 text-sm text-zinc-400">same weight</span>
            )}
            {target ? <span className="ml-auto mb-0.5 text-sm font-semibold text-zinc-100">{target}</span> : null}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-black/25 px-4 py-3">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              {recommendation.lastReps?.length ? (
                <>
                  <span className="text-lg font-bold tabular-nums text-zinc-400">
                    {recommendation.lastReps.join(" · ")}
                    <span className="sr-only"> reps last time</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="mb-1.5 h-4 w-4 text-orange-300" />
                </>
              ) : null}
              <span className="font-display text-3xl leading-none tabular-nums text-white">
                {recommendation.targetReps}
                <span className="ml-1 text-lg text-zinc-400">reps</span>
              </span>
              <span className="mb-0.5 text-sm text-zinc-400">
                on every set at {formatNumber(recommendation.currentWeight)} {unit}
              </span>
            </div>
            {recommendation.nextWeight > recommendation.currentWeight ? (
              <p className="mt-2 flex items-center gap-1.5 border-t border-white/[0.06] pt-2 text-sm text-zinc-300">
                <TrendingUpIcon aria-hidden="true" className="h-4 w-4 text-emerald-300" />
                Then the weight goes up to{" "}
                <span className="font-bold tabular-nums text-white">
                  {formatNumber(recommendation.nextWeight)} {unit}
                </span>
              </p>
            ) : null}
          </div>
        )
      ) : null}

      <p className="mt-3 text-sm leading-6 text-zinc-300">{recommendation.reason}</p>

      {warnings.length ? (
        <ul className="mt-3 space-y-1 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-sm text-amber-100">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {recommendation.detailedReasons?.length || contexts.length ? (
        <>
          <button
            aria-controls={detailsId}
            aria-expanded={open}
            className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200"
            type="button"
            onClick={() => setOpen((value) => !value)}
          >
            How this was decided
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <div className="mt-2 space-y-3" id={detailsId}>
              {recommendation.detailedReasons?.length ? (
                <ul className="space-y-1.5 text-sm leading-6 text-zinc-400">
                  {recommendation.detailedReasons.map((reason) => (
                    <li className="flex gap-2" key={reason}>
                      <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : null}
              {contexts.length ? (
                <dl className="grid gap-2 sm:grid-cols-3">
                  {contexts.map(([label, text]) => (
                    <div className="rounded-xl bg-black/25 p-3" key={label}>
                      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
                      <dd className="mt-0.5 text-sm leading-5 text-zinc-300">{text}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="text-xs text-zinc-500">{recommendation.confidence || "Low"} confidence</span>
        {recommendation.status === "active" && onStatusChange ? (
          <div className="flex gap-2">
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
              Hit it
            </button>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
};

export default OverloadCard;
