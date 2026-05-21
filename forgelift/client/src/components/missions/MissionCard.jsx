import { CheckCircle2, Dumbbell, Flame, Target, Trophy } from "lucide-react";
import Button from "../Button.jsx";
import MissionPriorityBadge from "./MissionPriorityBadge.jsx";
import MissionTypeBadge from "./MissionTypeBadge.jsx";
import AnimatedProgressBar from "../visuals/AnimatedProgressBar.jsx";
import StatPill from "../visuals/StatPill.jsx";
import StatusGlowCard from "../visuals/StatusGlowCard.jsx";

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short"
      }).format(new Date(date))
    : "-";

const missionIcons = {
  workout_frequency: Dumbbell,
  muscle_focus: Target,
  overload_target: Trophy,
  consistency: Flame,
  goal_path: Target
};

const MissionCard = ({ mission, onComplete, onOpen }) => {
  const Icon = missionIcons[mission.missionType] || Target;
  const variant = mission.priority === "Critical" || mission.priority === "High" ? "warning" : "neutral";

  return (
  <StatusGlowCard className="p-5" variant={mission.status === "completed" ? "success" : variant}>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/10 p-2 text-forge-ember">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-black text-white">{mission.title}</h2>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{mission.description}</p>
      </div>
      {mission.status === "active" && onComplete ? (
        <Button type="button" variant="secondary" onClick={() => onComplete(mission._id)}>
          <CheckCircle2 className="h-4 w-4" />
          Mark complete
        </Button>
      ) : null}
    </div>

    <div className="mb-4 flex flex-wrap gap-2">
      <MissionTypeBadge type={mission.missionType} />
      <MissionPriorityBadge priority={mission.priority} />
      <StatPill icon={Flame} variant="rank">+{mission.xpReward || 0} XP</StatPill>
      <StatPill variant={mission.status === "completed" ? "success" : "neutral"}>{mission.status}</StatPill>
    </div>

    <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
      <span>
        {mission.currentValue || 0}/{mission.targetValue || 1} {mission.unit}
      </span>
      <span>{mission.progressPercentage || 0}%</span>
    </div>
    <AnimatedProgressBar value={mission.progressPercentage || 0} variant={mission.status === "completed" ? "success" : "rank"} />

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-md bg-black/25 p-3 text-sm">
        <p className="text-slate-400">Target exercise</p>
        <p className="mt-1 font-bold text-white">{mission.targetExerciseName || "Any relevant exercise"}</p>
      </div>
      <div className="rounded-md bg-black/25 p-3 text-sm">
        <p className="text-slate-400">Week window</p>
        <p className="mt-1 font-bold text-white">
          {formatDate(mission.startDate)} - {formatDate(mission.endDate)}
        </p>
      </div>
    </div>

    {mission.targetMuscleGroups?.length ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {mission.targetMuscleGroups.map((muscle) => (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300" key={muscle}>
            {muscle}
          </span>
        ))}
      </div>
    ) : null}
    {onOpen ? (
      <button className="mt-4 min-h-10 w-full rounded-md bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15" type="button" onClick={() => onOpen(mission)}>
        View mission details
      </button>
    ) : null}
  </StatusGlowCard>
  );
};

export default MissionCard;
