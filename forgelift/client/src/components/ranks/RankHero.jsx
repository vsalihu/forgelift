import { motion, useReducedMotion } from "framer-motion";
import { getRankImage } from "../../utils/rankImages.js";
import { RANK_LADDER, rankIndex, shortScore } from "../../utils/rankLadder.js";
import { FlameIcon } from "../icons/featureIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);

const RankHero = ({ overallRank = "Copper", overallScore = 0, overallProgress, xp = 0 }) => {
  const reduce = useReducedMotion();
  const current = rankIndex(overallRank);
  const progress = overallProgress?.progressPercentage ?? 0;
  const nextName = overallProgress?.nextRank?.name;

  return (
    <section
      className="relative overflow-clip rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-forge-ember/[0.12] via-white/[0.02] to-transparent p-5 sm:p-8"
      data-tour-id="ranks-overview"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-forge-ember/20 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <motion.div
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          className="relative h-36 w-36 shrink-0 sm:h-44 sm:w-44"
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div aria-hidden="true" className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.55),transparent_70%)] blur-2xl" />
          <motion.img
            alt={`${overallRank} rank emblem`}
            animate={{ scale: 1, opacity: 1 }}
            className="relative h-full w-full object-contain drop-shadow-[0_18px_40px_rgba(249,115,22,0.45)]"
            height="320"
            initial={reduce ? false : { scale: 0.8, opacity: 0 }}
            src={getRankImage(overallRank)}
            transition={{ duration: 0.7, ease: EASE }}
            width="320"
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-orange-300">Overall rank</p>
          <h2 className="font-display mt-1 text-5xl leading-none text-white sm:text-6xl">{overallRank}</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm font-bold tabular-nums text-zinc-200">
              {formatNumber(overallScore)} points
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-forge-ember/30 bg-forge-ember/10 px-3 py-1 text-sm font-bold tabular-nums text-orange-100">
              <FlameIcon className="h-4 w-4" />
              {formatNumber(xp)} XP
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-zinc-200">{nextName ? `Next: ${nextName}` : "Top rank reached"}</span>
              <span className="tabular-nums text-zinc-400">
                {nextName ? `${formatNumber(overallProgress?.pointsToNextRank)} points to go` : "100%"}
              </span>
            </div>
            <div
              aria-label={nextName ? `${progress}% of the way to ${nextName}` : "Top rank reached"}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.08]"
              role="progressbar"
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300 shadow-[0_0_14px_rgba(249,115,22,0.7)]"
                initial={reduce ? false : { width: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
              />
            </div>
          </div>
        </div>
      </div>

      <ol aria-label="Rank ladder" className="relative mt-8 grid grid-cols-9 gap-1 border-t border-white/[0.06] pt-5">
        {RANK_LADDER.map((rank, index) => {
          const reached = index <= current;
          const isCurrent = index === current;
          return (
            <li aria-current={isCurrent ? "step" : undefined} className="flex min-w-0 flex-col items-center text-center" key={rank.name}>
              <span className={`relative flex h-9 w-9 items-center justify-center sm:h-12 sm:w-12 ${isCurrent ? "rounded-full bg-forge-ember/15 ring-1 ring-forge-ember/50" : ""}`}>
                <img
                  alt=""
                  className={`h-7 w-7 object-contain transition sm:h-9 sm:w-9 ${reached ? "" : "opacity-30 grayscale"}`}
                  height="36"
                  src={getRankImage(rank.name)}
                  width="36"
                />
              </span>
              <span className={`mt-1.5 hidden w-full truncate text-[0.7rem] font-bold sm:block ${isCurrent ? "text-white" : reached ? "text-zinc-400" : "text-zinc-600"}`}>{rank.name}</span>
              <span className={`text-[0.65rem] tabular-nums ${isCurrent ? "font-bold text-orange-300" : "text-zinc-600"}`}>{shortScore(rank.minScore)}</span>
              <span className="sr-only">
                {rank.name}, from {rank.minScore} points{isCurrent ? ", your current rank" : reached ? ", reached" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default RankHero;
