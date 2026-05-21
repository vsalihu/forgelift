import ProgressBar from "../ProgressBar.jsx";
import RankBadge from "./RankBadge.jsx";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const MuscleRankCard = ({ muscleRank }) => {
  const assessed = muscleRank.dataAvailable !== false && muscleRank.workoutCount > 0;

  return (
    <article className="metal-panel rounded-lg p-5 shadow-metal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{muscleRank.muscleGroup}</h2>
          <p className="mt-1 text-sm text-slate-400">{assessed ? `Score ${formatNumber(muscleRank.score)}` : "Unassessed"}</p>
        </div>
        {assessed ? <RankBadge rank={muscleRank.rank} /> : <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">Unassessed</span>}
      </div>

      {assessed ? (
        <ProgressBar
          label={`${muscleRank.pointsToNextRank || 0} points to ${muscleRank.nextRank || "max rank"}`}
          value={muscleRank.progressPercentage || 0}
        />
      ) : (
        <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-4 text-sm text-slate-400">
          Log real {muscleRank.muscleGroup?.toLowerCase()} work before ForgeLift assigns a meaningful muscle rank.
        </div>
      )}

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Strongest exercise</dt>
          <dd className="text-right text-white">{muscleRank.strongestExercise || "-"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Best estimated 1RM</dt>
          <dd className="text-right text-white">{formatNumber(muscleRank.bestEstimated1RM)}kg</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Total load</dt>
          <dd className="text-right text-white">{formatNumber(muscleRank.totalVolume)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Workout count</dt>
          <dd className="text-right text-white">{muscleRank.workoutCount || 0}</dd>
        </div>
      </dl>
    </article>
  );
};

export default MuscleRankCard;
