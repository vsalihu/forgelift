import RankBadge from "./RankBadge.jsx";
import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";
import ProgressRing from "../visuals/ProgressRing.jsx";
import StatPill from "../visuals/StatPill.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const RankProgressCard = ({ overallRank, overallScore, overallProgress, xp }) => {
  return (
    <section className="rounded-lg border border-forge-copper/40 bg-gradient-to-br from-forge-copper/25 via-forge-panel to-black/70 p-6 shadow-metal">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Overall Rank</p>
          <h1 className="mt-3 text-5xl font-black text-white">{overallRank}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <RankBadge rank={overallRank} />
            <StatPill variant="rank">{formatNumber(xp)} XP</StatPill>
          </div>
        </div>
        <ProgressRing
          label="Next rank"
          size={132}
          sublabel={overallProgress?.nextRank?.name || "Max"}
          value={overallProgress?.progressPercentage || 0}
          variant="rank"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md bg-black/25 p-4">
          <p className="text-sm text-slate-400">Overall score</p>
          <p className="mt-1 text-2xl font-black text-white">{formatNumber(overallScore)}</p>
        </div>
        <div className="rounded-md bg-black/25 p-4">
          <p className="text-sm text-slate-400">Next rank</p>
          <p className="mt-1 text-2xl font-black text-white">{overallProgress?.nextRank?.name || "Max"}</p>
        </div>
      </div>

      <div className="mt-6">
        <AnimatedProgressBar
          label={`${overallProgress?.pointsToNextRank || 0} points to next rank`}
          value={overallProgress?.progressPercentage || 0}
          variant="rank"
        />
      </div>
    </section>
  );
};

export default RankProgressCard;
