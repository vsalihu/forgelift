import { CheckCircle2, ShieldAlert, XCircle, ArrowRight, TrendingUp, Repeat2, TrendingDown, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../Button.jsx";
import ConfidenceBadge from "./ConfidenceBadge.jsx";
import HelpTooltip from "../ui/HelpTooltip.jsx";
import OverloadWarningList from "./OverloadWarningList.jsx";
import RecommendationTypeBadge from "./RecommendationTypeBadge.jsx";
import { helpText } from "../../utils/helpText.js";
import StatPill from "../visuals/StatPill.jsx";
import StatusGlowCard from "../visuals/StatusGlowCard.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const typeVisuals = {
  increase_weight: { variant: "success", icon: TrendingUp },
  repeat_weight: { variant: "info", icon: Repeat2 },
  increase_reps: { variant: "success", icon: TrendingUp },
  reduce_weight: { variant: "warning", icon: TrendingDown },
  recovery_warning: { variant: "warning", icon: AlertTriangle },
  plateau_warning: { variant: "warning", icon: AlertTriangle },
  deload_flag: { variant: "danger", icon: ShieldAlert },
  reduce_volume: { variant: "warning", icon: TrendingDown }
};

const OverloadRecommendationCard = ({ recommendation, onStatusChange, activeDeload }) => {
  const [showDetails, setShowDetails] = useState(false);
  const visual = typeVisuals[recommendation.recommendationType] || { variant: "neutral", icon: ArrowRight };
  const VisualIcon = visual.icon;

  return (
    <StatusGlowCard className="p-5" variant={activeDeload ? "danger" : visual.variant}>
      {activeDeload ? (
        <div className="mb-4 rounded-md border border-orange-400/20 bg-orange-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-orange-100">
            <ShieldAlert className="h-4 w-4" />
            Deload recommendation active
          </div>
          <p className="mt-2 text-sm text-orange-100/90">
            Do not follow aggressive overload until this deload is completed.{" "}
            <Link className="font-semibold text-forge-copper hover:text-orange-300" to="/deload">
              View deload plan
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/10 p-2 text-forge-ember">
              <VisualIcon className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black text-white">{recommendation.exerciseName}</h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <RecommendationTypeBadge type={recommendation.recommendationType} />
            <ConfidenceBadge confidence={recommendation.confidence} />
            <HelpTooltip {...helpText.confidence} size="xs" />
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

      <div className="mb-4 rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Next weight</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-black text-white">{formatNumber(recommendation.currentWeight)}kg</span>
          <ArrowRight className="h-5 w-5 text-forge-ember" />
          <span className="text-2xl font-black text-white">{formatNumber(recommendation.recommendedWeight)}kg</span>
          <StatPill variant={visual.variant}>{recommendation.recommendedRepTarget || "Target reps"}</StatPill>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md bg-black/25 p-3">
          <p className="text-xs text-slate-400">Rep target <HelpTooltip title="Rep Target" content="The rep range ForgeLift suggests aiming for next time." size="xs" /></p>
          <p className="mt-1 font-bold text-white">{recommendation.recommendedRepTarget || "-"}</p>
        </div>
        <div className="rounded-md bg-black/25 p-3">
          <p className="text-xs text-slate-400">Sets</p>
          <p className="mt-1 font-bold text-white">{recommendation.recommendedSets || "-"}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{recommendation.reason}</p>

      {recommendation.muscleGroups?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {recommendation.muscleGroups.map((muscle) => (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300" key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      ) : null}

      <button className="mt-4 text-sm font-semibold text-forge-ember hover:text-orange-300" type="button" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? "Hide details" : "View details"}
      </button>

      {showDetails ? (
        <>
          {recommendation.detailedReasons?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {recommendation.detailedReasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recommendation.goalPathContext ? (
              <div className="rounded-md bg-black/20 p-3 text-sm text-slate-400">{recommendation.goalPathContext}</div>
            ) : null}
            {recommendation.recoveryContext ? (
              <div className="rounded-md bg-black/20 p-3 text-sm text-slate-400">
                Recovery <HelpTooltip {...helpText.recoveryReadiness} size="xs" />: {recommendation.recoveryContext}
              </div>
            ) : null}
            {recommendation.weakPointContext ? (
              <div className="rounded-md bg-black/20 p-3 text-sm text-slate-400">
                Weak point <HelpTooltip {...helpText.weakPoint} size="xs" />: {recommendation.weakPointContext}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="mt-4">
        <OverloadWarningList warnings={recommendation.warnings} />
      </div>
    </StatusGlowCard>
  );
};

export default OverloadRecommendationCard;
