import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { FlameIcon, SuccessIcon } from "../icons/featureIcons.jsx";
import { missionMeta, priorityStyles, progressText } from "./missionMeta.js";

const MissionCard = ({ mission, index = 0, onComplete, onOpen }) => {
  const reduce = useReducedMotion();
  const { label, icon: Icon } = missionMeta(mission.missionType);
  const progress = Math.min(100, mission.progressPercentage || 0);
  const done = mission.status === "completed";
  const urgent = mission.priority === "High" || mission.priority === "Critical";

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl border p-4 transition-colors sm:p-5 ${
        done ? "border-emerald-400/25 bg-emerald-500/[0.05]" : urgent ? "border-forge-ember/25 bg-gradient-to-b from-forge-ember/[0.07] to-white/[0.01]" : "border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01]"
      }`}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${done ? "bg-emerald-400/15 text-emerald-300" : "bg-forge-ember/15 text-orange-200"}`}>
          {done ? <SuccessIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
            <span className="text-zinc-500">{label}</span>
            {urgent && !done ? <span className={`rounded-full px-2 py-0.5 ${priorityStyles[mission.priority]}`}>{mission.priority} priority</span> : null}
          </div>
          <h3 className="mt-1 text-lg font-bold leading-snug text-white">{mission.title}</h3>
          {mission.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">{mission.description}</p> : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-sm font-bold tabular-nums text-orange-200">
          <FlameIcon aria-hidden="true" className="h-3.5 w-3.5" />
          {mission.xpReward || 0}
          <span className="sr-only"> XP</span>
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums text-zinc-200">{progressText(mission)}</span>
          <span className="tabular-nums text-zinc-500">{progress}%</span>
        </div>
        <div aria-label={`${mission.title}: ${progress}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
          <motion.div
            animate={{ width: `${progress}%` }}
            className={`h-full rounded-full ${done ? "bg-emerald-400" : "bg-gradient-to-r from-forge-copper to-orange-300"}`}
            initial={reduce ? false : { width: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {mission.targetMuscleGroups?.length || mission.targetExerciseName ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mission.targetExerciseName ? <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">{mission.targetExerciseName}</span> : null}
          {(mission.targetMuscleGroups || []).map((muscle) => (
            <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs font-semibold text-zinc-400" key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        {onOpen ? (
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => onOpen(mission)}
          >
            Details
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        {mission.status === "active" && onComplete ? (
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => onComplete(mission._id)}
          >
            <SuccessIcon className="h-4 w-4" />
            Mark done
          </button>
        ) : null}
      </div>
    </motion.article>
  );
};

export default MissionCard;
