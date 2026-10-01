import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const METRICS = [
  { key: "xp", label: "XP", format: (entry) => `${formatNumber(entry.xp)} XP` },
  { key: "lifetimeVolume", label: "Volume", format: (entry) => `${formatNumber(entry.lifetimeVolume)}kg` },
  { key: "lifetimeReps", label: "Reps", format: (entry) => `${formatNumber(entry.lifetimeReps)} reps` }
];

const PLACE_STYLES = ["text-amber-300", "text-zinc-300", "text-orange-400"];

const FriendLeaderboard = ({ entries }) => {
  const [metric, setMetric] = useState("xp");
  const active = METRICS.find((item) => item.key === metric);
  const sorted = useMemo(() => [...entries].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)), [entries, metric]);
  const top = sorted[0]?.[metric] || 1;

  return (
    <div>
      <div aria-label="Rank by" className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
        {METRICS.map((item) => (
          <button
            aria-checked={metric === item.key}
            className={`min-h-9 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${metric === item.key ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"}`}
            key={item.key}
            role="radio"
            type="button"
            onClick={() => setMetric(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ol className="space-y-2">
        {sorted.map((entry, index) => (
          <li key={entry._id}>
            <Link
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-white/[0.05] ${entry.isSelf ? "border-forge-ember/40 bg-forge-ember/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}
              to={`/u/${entry.username}`}
            >
              <span className={`font-display w-7 shrink-0 text-center text-xl tabular-nums ${PLACE_STYLES[index] || "text-zinc-500"}`}>{index + 1}</span>
              <Avatar name={entry.name} rank={entry.currentOverallRank} self={entry.isSelf} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">
                  {entry.name}
                  {entry.isSelf ? <span className="font-normal text-orange-300"> (you)</span> : null}
                </span>
                <span aria-hidden="true" className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="block h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300" style={{ width: `${Math.max(3, ((entry[metric] || 0) / top) * 100)}%` }} />
                </span>
              </span>
              <span className="shrink-0 text-right text-sm font-bold tabular-nums text-zinc-100">{active.format(entry)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default FriendLeaderboard;
