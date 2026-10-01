import { ActivityIcon, RepeatIcon, TrendingDownIcon, TrendingUpIcon } from "../icons/featureIcons.jsx";
import { DeloadIcon, RecoveryIcon } from "../icons/navIcons.jsx";

// What each recommendation asks you to do, as a status with an icon and label.
export const OVERLOAD_TYPES = {
  increase_weight: { label: "Add weight", tone: "good", icon: TrendingUpIcon, group: "up" },
  increase_reps: { label: "Add reps", tone: "good", icon: TrendingUpIcon, group: "up" },
  repeat_weight: { label: "Repeat", tone: "info", icon: RepeatIcon, group: "repeat" },
  reduce_weight: { label: "Reduce weight", tone: "caution", icon: TrendingDownIcon, group: "back" },
  reduce_volume: { label: "Cut volume", tone: "caution", icon: TrendingDownIcon, group: "back" },
  recovery_warning: { label: "Recover first", tone: "serious", icon: RecoveryIcon, group: "warn" },
  plateau_warning: { label: "Plateau", tone: "serious", icon: ActivityIcon, group: "warn" },
  deload_flag: { label: "Deload", tone: "critical", icon: DeloadIcon, group: "warn" }
};

export const overloadType = (type) => OVERLOAD_TYPES[type] || { label: type ? type.replaceAll("_", " ") : "Recommendation", tone: "neutral", icon: ActivityIcon, group: "other" };

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "up", label: "Go up" },
  { key: "repeat", label: "Repeat" },
  { key: "back", label: "Back off" },
  { key: "warn", label: "Warnings" }
];
