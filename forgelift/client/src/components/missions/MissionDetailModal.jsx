import { Dumbbell, ExternalLink, Flame, Target, X } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../Button.jsx";
import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";

const MissionDetailModal = ({ mission, onClose, onComplete }) => {
  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 p-3">
      <div className="mx-auto flex h-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-forge-panel shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-forge-copper">Mission Detail</p>
            <h2 className="mt-1 text-2xl font-black text-white">{mission.title}</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <p className="text-sm leading-6 text-slate-300">{mission.description}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-black/25 p-4">
              <p className="text-sm text-slate-400">Progress</p>
              <p className="mt-1 text-xl font-black text-white">{mission.currentValue || 0}/{mission.targetValue || 1}</p>
            </div>
            <div className="rounded-lg bg-black/25 p-4">
              <p className="text-sm text-slate-400">Reward</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black text-forge-copper"><Flame className="h-5 w-5" />{mission.xpReward || 0} XP</p>
            </div>
            <div className="rounded-lg bg-black/25 p-4">
              <p className="text-sm text-slate-400">Priority</p>
              <p className="mt-1 text-xl font-black text-white">{mission.priority || "Normal"}</p>
            </div>
          </div>
          <AnimatedProgressBar value={mission.progressPercentage || 0} variant="rank" />
          <section className="rounded-lg bg-black/25 p-4">
            <h3 className="font-bold text-white">Why ForgeLift generated this</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {mission.reason || mission.recommendation || "This mission is based on your recent training data, goal path, recovery, weak points, and weekly target."}
            </p>
          </section>
          {mission.targetMuscleGroups?.length ? (
            <section>
              <h3 className="mb-2 font-bold text-white">Target muscles</h3>
              <div className="flex flex-wrap gap-2">
                {mission.targetMuscleGroups.map((muscle) => (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200" key={muscle}>{muscle}</span>
                ))}
              </div>
            </section>
          ) : null}
          <section className="grid gap-3 sm:grid-cols-2">
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white" to="/gym-mode">
              <Dumbbell className="h-4 w-4" />
              Start Related Workout
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white" to="/exercises">
              <ExternalLink className="h-4 w-4" />
              View Exercise Library
            </Link>
          </section>
        </div>
        <div className="border-t border-white/10 p-4">
          {mission.status === "active" ? (
            <Button className="w-full" type="button" onClick={() => onComplete?.(mission._id)}>
              <Target className="h-4 w-4" />
              Mark Mission Complete
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MissionDetailModal;
