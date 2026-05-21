import { CheckCircle2, XCircle } from "lucide-react";
import Button from "../Button.jsx";
import HelpTooltip from "../ui/HelpTooltip.jsx";
import DeloadPlanList from "./DeloadPlanList.jsx";
import DeloadSeverityBadge from "./DeloadSeverityBadge.jsx";
import DeloadTypeBadge from "./DeloadTypeBadge.jsx";
import { helpText } from "../../utils/helpText.js";
import ProgressRing from "../visuals/ProgressRing.jsx";
import StatusGlowCard from "../visuals/StatusGlowCard.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const DeloadRecommendationCard = ({ recommendation, onStatusChange }) => (
  <StatusGlowCard className="p-5" variant={recommendation.severity === "Critical" || recommendation.severity === "High" ? "danger" : "warning"}>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <ProgressRing
          label="Reduce"
          size={104}
          value={recommendation.reductionPercentage || 0}
          variant={recommendation.severity === "Critical" || recommendation.severity === "High" ? "danger" : "warning"}
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">
            {recommendation.scope?.replaceAll("_", " ")}
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            {recommendation.exerciseName || recommendation.muscleGroup || "Full body"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <DeloadTypeBadge type={recommendation.recommendationType} />
            <DeloadSeverityBadge severity={recommendation.severity} />
            <HelpTooltip {...helpText.deload} size="xs" />
          </div>
        </div>
      </div>
      {recommendation.status === "active" && onStatusChange ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => onStatusChange(recommendation._id, "completed")}>
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </Button>
          <Button type="button" variant="ghost" onClick={() => onStatusChange(recommendation._id, "ignored")}>
            <XCircle className="h-4 w-4" />
            Ignore
          </Button>
        </div>
      ) : null}
    </div>

    <p className="text-sm leading-6 text-slate-300">{recommendation.reason}</p>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Current weight</p>
        <p className="mt-1 font-bold text-white">{formatNumber(recommendation.currentWeight)} kg</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Recommended weight</p>
        <p className="mt-1 font-bold text-white">{formatNumber(recommendation.recommendedWeight)} kg</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Current volume</p>
        <p className="mt-1 font-bold text-white">{formatNumber(recommendation.currentVolume)}</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Recommended volume</p>
        <p className="mt-1 font-bold text-white">{formatNumber(recommendation.recommendedVolume)}</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Reduction <HelpTooltip title="Deload Reduction" content="How much easier ForgeLift suggests making this exercise or muscle group." example="10% less weight or 30% less volume." size="xs" /></p>
        <p className="mt-1 font-bold text-white">{formatNumber(recommendation.reductionPercentage)}%</p>
      </div>
      <div className="rounded-md bg-black/25 p-3">
        <p className="text-xs text-slate-400">Rest</p>
        <p className="mt-1 font-bold text-white">{recommendation.recommendedRestDays || 0} days</p>
      </div>
    </div>

    {recommendation.detailedReasons?.length ? (
      <ul className="mt-4 space-y-2 text-sm text-slate-400">
        {recommendation.detailedReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    ) : null}

    {recommendation.warnings?.length ? (
      <div className="mt-4 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
        {recommendation.warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
      </div>
    ) : null}

    <div className="mt-4">
      <DeloadPlanList plan={recommendation.plan} />
    </div>
  </StatusGlowCard>
);

export default DeloadRecommendationCard;
