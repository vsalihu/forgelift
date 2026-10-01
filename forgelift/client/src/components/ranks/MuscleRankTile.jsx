import { motion, useReducedMotion } from "framer-motion";
import { getBroadMuscleImage } from "../../utils/muscleImages.js";
import { getRankImage } from "../../utils/rankImages.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const daysAgo = (date) => {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "Trained today";
  if (days === 1) return "Trained yesterday";
  return `Trained ${days} days ago`;
};

const MuscleRankTile = ({ muscleRank, tag, index = 0 }) => {
  const reduce = useReducedMotion();
  const image = getBroadMuscleImage(muscleRank.muscleGroup);
  const progress = muscleRank.progressPercentage || 0;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="flex items-start gap-3">
        {image ? <img alt="" className="h-12 w-12 shrink-0 rounded-2xl bg-black/30 object-contain p-1" height="48" src={image} width="48" /> : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white">{muscleRank.muscleGroup}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-400">
            <img alt="" className="h-4 w-4 object-contain" height="16" src={getRankImage(muscleRank.rank)} width="16" />
            <span className="font-semibold text-zinc-200">{muscleRank.rank}</span>
            <span className="tabular-nums text-zinc-500">· {formatNumber(muscleRank.score)}</span>
          </p>
        </div>
        {tag ? (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${tag.tone === "ember" ? "bg-forge-ember/15 text-orange-200" : "bg-white/[0.07] text-zinc-300"}`}>{tag.label}</span>
        ) : null}
      </header>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{muscleRank.nextRank ? `To ${muscleRank.nextRank}` : "Top rank"}</span>
          <span className="tabular-nums">{muscleRank.nextRank ? `${formatNumber(muscleRank.pointsToNextRank)} pts` : "100%"}</span>
        </div>
        <div aria-label={`${muscleRank.muscleGroup}: ${progress}% to ${muscleRank.nextRank || "top rank"}`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
          <div className="h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="col-span-2 min-w-0">
          <dt className="text-xs text-zinc-500">Strongest lift</dt>
          <dd className="truncate font-semibold text-zinc-100">
            {muscleRank.strongestExercise || "–"}
            {muscleRank.bestEstimated1RM ? <span className="font-normal tabular-nums text-zinc-400"> · e1RM {formatNumber(muscleRank.bestEstimated1RM)}kg</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Workouts</dt>
          <dd className="font-semibold tabular-nums text-zinc-100">{muscleRank.workoutCount || 0}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-zinc-500">Last trained</dt>
          <dd className="truncate font-semibold text-zinc-100">{daysAgo(muscleRank.lastTrainedAt)?.replace("Trained ", "") || "–"}</dd>
        </div>
      </dl>
    </motion.article>
  );
};

export default MuscleRankTile;
