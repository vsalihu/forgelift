import { Link } from "react-router-dom";
import { HistoryIcon, OverloadIcon } from "../icons/navIcons.jsx";
import { formatNumber } from "./gymUtils.js";

// "Last time" and the coach suggestion for one exercise. Shared by Gym Mode and Log Workout.
const ExerciseHints = ({ history, suggestion, onUse, useLabel = "", className = "" }) => {
  if (!history?.lastReps && !suggestion) return null;

  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      {history?.lastReps ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 px-3.5 py-3">
          <HistoryIcon className="h-5 w-5 shrink-0 text-zinc-500" />
          <div className="min-w-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-zinc-500">Last time</p>
            <p className="truncate text-sm font-bold tabular-nums text-zinc-100">
              {history.lastWeight ? `${formatNumber(history.lastWeight)}kg` : "Bodyweight"} × {history.lastReps}
            </p>
          </div>
        </div>
      ) : null}
      {suggestion ? (
        <div className="flex items-center gap-3 rounded-2xl border border-forge-ember/25 bg-forge-ember/[0.08] px-3.5 py-3">
          <OverloadIcon className="h-5 w-5 shrink-0 text-orange-300" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-orange-300/90">{suggestion.source}</p>
            <p className="truncate text-sm font-bold tabular-nums text-white">
              {formatNumber(suggestion.weight)}kg{suggestion.repLabel ? ` × ${suggestion.repLabel}` : ""}
            </p>
          </div>
          <button
            aria-label={`Use ${formatNumber(suggestion.weight)}kg${suggestion.repLabel ? ` for ${suggestion.repLabel}` : ""} ${useLabel}`.trim()}
            className="min-h-9 shrink-0 rounded-full bg-forge-ember/20 px-3.5 text-sm font-bold text-orange-100 transition-colors hover:bg-forge-ember/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            title={suggestion.reason}
            type="button"
            onClick={onUse}
          >
            Use
          </button>
        </div>
      ) : null}
    </div>
  );
};

// Bodyweight exercises: bodyweight only, or bodyweight plus added weight.
export const LoadTypeToggle = ({ bodyweight, weighted, onChange, className = "" }) => (
  <div className={className}>
    {bodyweight ? (
      <div aria-label="Load type" className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
        {[
          { value: false, label: "Bodyweight" },
          { value: true, label: "Add weight" }
        ].map((option) => (
          <button
            aria-checked={weighted === option.value}
            className={`min-h-10 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
              weighted === option.value ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
            }`}
            key={option.label}
            role="radio"
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    ) : (
      <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100">
        Add your bodyweight to log bodyweight sets.{" "}
        <Link className="font-bold underline underline-offset-2" to="/profile">
          Open profile
        </Link>
      </p>
    )}
  </div>
);

export default ExerciseHints;
