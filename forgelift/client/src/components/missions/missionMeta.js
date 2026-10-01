import { FirstPlaceIcon, FlameIcon, GoalIcon } from "../icons/featureIcons.jsx";
import { BalanceIcon, DeloadIcon, DumbbellIcon, OverloadIcon, RecoveryIcon, WeakPointsIcon } from "../icons/navIcons.jsx";

export const missionTypes = {
  workout_frequency: { label: "Workout frequency", icon: DumbbellIcon },
  muscle_focus: { label: "Muscle focus", icon: GoalIcon },
  overload_target: { label: "Overload target", icon: OverloadIcon },
  recovery_discipline: { label: "Recovery", icon: RecoveryIcon },
  deload_compliance: { label: "Deload", icon: DeloadIcon },
  weak_point_fix: { label: "Weak point", icon: WeakPointsIcon },
  training_balance: { label: "Balance", icon: BalanceIcon },
  pr_challenge: { label: "PR challenge", icon: FirstPlaceIcon },
  consistency: { label: "Consistency", icon: FlameIcon },
  goal_path: { label: "Goal path", icon: GoalIcon }
};

export const missionMeta = (type) => missionTypes[type] || { label: type ? type.replaceAll("_", " ") : "Mission", icon: GoalIcon };

export const priorityStyles = {
  Critical: "bg-red-500/15 text-red-200",
  High: "bg-orange-500/15 text-orange-200",
  Medium: "bg-white/[0.07] text-zinc-300",
  Low: "bg-white/[0.05] text-zinc-400"
};

export const formatShortDate = (date) => (date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

export const progressText = (mission) => `${mission.currentValue || 0}/${mission.targetValue || 1}${mission.unit ? ` ${mission.unit}` : ""}`;
