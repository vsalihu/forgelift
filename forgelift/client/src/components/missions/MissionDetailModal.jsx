import { Link } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet.jsx";
import { FlameIcon, SuccessIcon } from "../icons/featureIcons.jsx";
import { ExerciseLibraryIcon, GymModeIcon } from "../icons/navIcons.jsx";
import { formatShortDate, missionMeta, priorityStyles, progressText } from "./missionMeta.js";

const MissionDetailModal = ({ mission, onClose, onComplete }) => {
  const meta = missionMeta(mission?.missionType);
  const progress = Math.min(100, mission?.progressPercentage || 0);
  const Icon = meta.icon;

  return (
    <BottomSheet open={Boolean(mission)} title="Mission" onClose={onClose}>
      {mission ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forge-ember/15 text-orange-200">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-500">
                {meta.label}
                {mission.startDate ? ` · ${formatShortDate(mission.startDate)} – ${formatShortDate(mission.endDate)}` : ""}
              </p>
              <h3 className="font-display mt-1 text-2xl leading-tight text-white">{mission.title}</h3>
            </div>
          </div>

          {mission.description ? <p className="text-sm leading-6 text-zinc-300">{mission.description}</p> : null}

          <dl className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-black/25 p-3">
              <dt className="text-xs text-zinc-500">Progress</dt>
              <dd className="mt-0.5 font-bold tabular-nums text-white">{progressText(mission)}</dd>
            </div>
            <div className="rounded-2xl bg-black/25 p-3">
              <dt className="text-xs text-zinc-500">Reward</dt>
              <dd className="mt-0.5 flex items-center gap-1 font-bold tabular-nums text-orange-200">
                <FlameIcon aria-hidden="true" className="h-4 w-4" />
                {mission.xpReward || 0} XP
              </dd>
            </div>
            <div className="rounded-2xl bg-black/25 p-3">
              <dt className="text-xs text-zinc-500">Priority</dt>
              <dd className="mt-0.5">
                <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${priorityStyles[mission.priority] || priorityStyles.Medium}`}>{mission.priority || "Medium"}</span>
              </dd>
            </div>
          </dl>
          <div aria-label={`${progress}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar">
            <div className="h-full rounded-full bg-gradient-to-r from-forge-copper to-orange-300" style={{ width: `${progress}%` }} />
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <h4 className="text-sm font-bold text-white">Why this mission</h4>
            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
              {mission.reason || mission.recommendation || "Built from your recent training, recovery, weak points and goal for this week."}
            </p>
          </section>

          {mission.targetMuscleGroups?.length || mission.targetExerciseName ? (
            <section>
              <h4 className="mb-2 text-sm font-bold text-white">Targets</h4>
              <div className="flex flex-wrap gap-1.5">
                {mission.targetExerciseName ? <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-semibold text-zinc-200">{mission.targetExerciseName}</span> : null}
                {(mission.targetMuscleGroups || []).map((muscle) => (
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-sm font-semibold text-zinc-300" key={muscle}>
                    {muscle}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02]" to="/gym-mode">
              <GymModeIcon className="h-4 w-4" />
              Train for it in Gym Mode
            </Link>
            <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] text-sm font-bold text-white" to="/exercises">
              <ExerciseLibraryIcon className="h-4 w-4" />
              Exercise library
            </Link>
          </div>
          {mission.status === "active" ? (
            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20"
              type="button"
              onClick={() => onComplete?.(mission._id)}
            >
              <SuccessIcon className="h-4 w-4" />
              Mark mission done
            </button>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  );
};

export default MissionDetailModal;
