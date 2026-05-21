import { useState } from "react";
import HelpTooltip from "../ui/HelpTooltip.jsx";
import ProgressRing from "../visuals/ProgressRing.jsx";
import StatPill from "../visuals/StatPill.jsx";
import RecoveryStatusBadge from "./RecoveryStatusBadge.jsx";
import { helpText } from "../../utils/helpText.js";

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(date))
    : "-";
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const RecoveryCard = ({ recovery }) => {
  const hasData = recovery.dataAvailable !== false && recovery.score !== null && recovery.score !== undefined;
  const ringVariant =
    recovery.score >= 80 ? "success" : recovery.score >= 60 ? "warning" : recovery.score >= 40 ? "warning" : "danger";
  const [showReasons, setShowReasons] = useState(false);

  return (
    <article className="metal-panel rounded-lg p-5 shadow-metal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{recovery.muscleGroup}</h2>
          <p className="mt-1 text-sm text-slate-400">{recovery.restRecommendationHours || 0}h recommended rest</p>
        </div>
        <RecoveryStatusBadge status={recovery.status} />
      </div>

      {hasData ? (
        <div className="flex items-center gap-4">
          <ProgressRing label="Ready" size={104} value={recovery.score || 0} variant={ringVariant} />
          <div className="flex flex-1 flex-wrap gap-2">
            <StatPill variant={ringVariant}>{recovery.score || 0}% recovered</StatPill>
            <StatPill variant="neutral">{recovery.restRecommendationHours || 0}h rest</StatPill>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-4">
          <p className="font-bold text-white">No data yet</p>
          <p className="mt-1 text-sm text-slate-400">Log this muscle before ForgeLift estimates recovery.</p>
        </div>
      )}

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Next heavy training <HelpTooltip title="Next Recommended Training Time" content="The earliest time ForgeLift suggests heavy direct work for this muscle." size="xs" /></dt>
          <dd className="text-right text-white">{formatDate(recovery.nextRecommendedTrainingTime)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Direct load <HelpTooltip {...helpText.directLoad} size="xs" /></dt>
          <dd className="text-white">{formatNumber(recovery.lastDirectLoad)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Indirect load <HelpTooltip {...helpText.indirectLoad} size="xs" /></dt>
          <dd className="text-white">{formatNumber(recovery.lastIndirectLoad)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Stabiliser load <HelpTooltip {...helpText.stabiliserLoad} size="xs" /></dt>
          <dd className="text-white">{formatNumber(recovery.lastStabiliserLoad)}</dd>
        </div>
      </dl>

      {recovery.reasons?.length ? (
        <div className="mt-4">
          <button className="text-sm font-semibold text-forge-ember hover:text-orange-300" type="button" onClick={() => setShowReasons(!showReasons)}>
            {showReasons ? "Hide details" : "Why?"}
          </button>
          {showReasons ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {recovery.reasons.slice(0, 5).map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default RecoveryCard;
