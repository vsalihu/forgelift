import { CheckCircle2, Circle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";
import StatusGlowCard from "../visuals/StatusGlowCard.jsx";

const statusCopy = {
  empty: "Not enough data yet",
  starting: "Starting profile",
  learning: "ForgeLift is learning",
  ready: "Ready for recommendations"
};

const DataReadinessCard = ({ readiness }) => {
  if (!readiness) return null;

  const checklist = [
    { label: "Bodyweight saved", done: readiness.hasBodyweight, to: "/profile" },
    { label: "Assessment complete", done: readiness.hasAssessment, to: "/assessment" },
    { label: "Strength baseline added", done: readiness.hasStrengthBaselines, to: "/strength-baselines" },
    { label: "3+ workouts logged", done: readiness.workoutCount >= 3, to: "/gym-mode" },
    { label: "Push, pull, and legs covered", done: readiness.missingMuscleGroups?.length === 0, to: "/gym-mode" }
  ];
  const progress = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
  const variant = readiness.overallReadiness === "ready" ? "success" : readiness.overallReadiness === "empty" ? "warning" : "info";

  return (
    <StatusGlowCard variant={variant}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-forge-ember" />
            <h2 className="text-lg font-black text-white">{statusCopy[readiness.overallReadiness] || "Data readiness"}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {readiness.overallReadiness === "ready"
              ? "ForgeLift has enough real training data for stronger recommendations."
              : "ForgeLift needs a little more real data before making confident claims."}
          </p>
        </div>
        <div className="min-w-48">
          <AnimatedProgressBar label="Readiness" value={progress} variant={variant} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {checklist.map((item) => (
          <Link className="flex items-center gap-2 rounded-md bg-black/20 p-3 text-sm text-slate-200 hover:bg-white/10" key={item.label} to={item.to}>
            {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Circle className="h-4 w-4 text-slate-500" />}
            {item.label}
          </Link>
        ))}
      </div>

      {readiness.messages?.length ? (
        <div className="mt-4 rounded-md bg-black/20 p-3 text-sm text-slate-400">
          {readiness.messages.slice(0, 3).map((message) => (
            <p key={message}>- {message}</p>
          ))}
        </div>
      ) : null}
    </StatusGlowCard>
  );
};

export default DataReadinessCard;
