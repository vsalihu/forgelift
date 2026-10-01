import { AlertTriangle } from "lucide-react";
import StatPill from "../visuals/StatPill.jsx";
import { DetrainingIcon, FlameIcon, TrendingDownIcon, TrendingUpIcon } from "../icons/featureIcons.jsx";

const quadrantConfig = {
  "Real Progress": { variant: "success", icon: TrendingUpIcon, label: "Real Progress" },
  Overreaching: { variant: "warning", icon: FlameIcon, label: "Overreaching" },
  "Fatigued Without Gains": { variant: "danger", icon: AlertTriangle, label: "Fatigued, No Gains" },
  Detraining: { variant: "info", icon: DetrainingIcon, label: "Detraining" },
  Maintaining: { variant: "neutral", icon: TrendingUpIcon, label: "Maintaining" },
  "Not Enough Data": { variant: "neutral", icon: TrendingDownIcon, label: "Not Enough Data" }
};

const acwrVariant = {
  "No Data": "neutral",
  Undertraining: "info",
  "Sweet Spot": "success",
  Caution: "warning",
  "High Risk": "danger"
};

const strengthVariant = {
  "No Data": "neutral",
  Rising: "success",
  Stable: "neutral",
  Declining: "danger"
};

const formatTrend = (value) => {
  if (value === null || value === undefined) return "--";
  return `${value > 0 ? "+" : ""}${value}%`;
};

const TrainingLoadCard = ({ trainingLoad }) => {
  const config = quadrantConfig[trainingLoad.quadrant] || quadrantConfig["Not Enough Data"];
  const Icon = config.icon;

  return (
    <article className="metal-panel rounded-lg p-5 shadow-metal">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-xl font-black text-white">{trainingLoad.muscleGroup}</h2>
        <StatPill icon={Icon} variant={config.variant}>
          {config.label}
        </StatPill>
      </div>

      <p className="text-sm leading-6 text-slate-300">{trainingLoad.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatPill variant={acwrVariant[trainingLoad.acwrStatus] || "neutral"}>
          ACWR {trainingLoad.acwr ?? "--"} · {trainingLoad.acwrStatus}
        </StatPill>
        <StatPill variant={strengthVariant[trainingLoad.strengthDirection] || "neutral"}>
          Strength {formatTrend(trainingLoad.strengthTrendPercent)} · {trainingLoad.strengthDirection}
        </StatPill>
      </div>
    </article>
  );
};

export default TrainingLoadCard;
