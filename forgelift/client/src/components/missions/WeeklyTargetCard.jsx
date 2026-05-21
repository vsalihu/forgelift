import { Flame } from "lucide-react";
import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";
import ProgressRing from "../visuals/ProgressRing.jsx";
import StatPill from "../visuals/StatPill.jsx";

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short"
      }).format(new Date(date))
    : "-";

const WeeklyTargetCard = ({ weeklyTarget }) => {
  if (!weeklyTarget) return null;

  const workoutProgress = Math.min(
    100,
    Math.round(((weeklyTarget.completedWorkouts || 0) / Math.max(weeklyTarget.targetWorkouts || 1, 1)) * 100)
  );

  return (
    <section className="metal-panel rounded-lg p-5">
      <div className="mb-5 flex items-center gap-4">
        <ProgressRing
          label="Week"
          size={112}
          value={weeklyTarget.completedWorkouts || 0}
          max={weeklyTarget.targetWorkouts || 1}
          variant={workoutProgress >= 100 ? "success" : "rank"}
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Weekly Target</p>
          <h2 className="mt-2 text-xl font-black text-white">
            {weeklyTarget.completedWorkouts || 0}/{weeklyTarget.targetWorkouts || 0} workouts completed
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {formatDate(weeklyTarget.weekStart)} - {formatDate(weeklyTarget.weekEnd)}
          </p>
          <div className="mt-3">
            <StatPill icon={Flame} variant="rank">Weekly streak target</StatPill>
          </div>
        </div>
      </div>

      <AnimatedProgressBar label="Workout progress" value={workoutProgress} variant={workoutProgress >= 100 ? "success" : "rank"} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-black/25 p-3">
          <p className="text-sm text-slate-400">Completed volume</p>
          <p className="mt-1 text-xl font-black text-white">{weeklyTarget.completedVolume || 0} kg</p>
        </div>
        <div className="rounded-md bg-black/25 p-3">
          <p className="text-sm text-slate-400">Target volume</p>
          <p className="mt-1 text-xl font-black text-white">{weeklyTarget.targetVolume || 0} kg</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-bold text-white">Target muscles</p>
        <div className="flex flex-wrap gap-2">
          {(weeklyTarget.targetMuscleGroups || []).map((muscle) => (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                weeklyTarget.completedMuscleGroups?.includes(muscle)
                  ? "bg-green-500/10 text-green-200"
                  : "bg-white/10 text-slate-300"
              }`}
              key={muscle}
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeeklyTargetCard;
