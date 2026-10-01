const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

export const keyFromDate = (date) => toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());

export const todayKey = () => keyFromDate(new Date());

export const addDaysToKey = (key, days) => {
  const [year, month, day] = key.split("-").map(Number);
  return keyFromDate(new Date(year, month - 1, day + days));
};

export const keyToLocalDate = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// What a day shows: a finished workout wins over any plan for that day.
export const dayStatus = (dayData, key, today = todayKey()) => {
  if (dayData?.workouts?.length) {
    return { kind: "done", label: "Done", title: dayData.workouts[0].title || "Workout" };
  }
  const entry = dayData?.entry;
  if (!entry) return null;
  if (entry.type === "rest") return { kind: "rest", label: "Rest", title: "Rest day" };
  if (entry.type === "treatment") return { kind: "treatment", label: "Treatment", title: "Treatment" };
  const title = entry.workoutTemplateId?.name || entry.plannedTitle || "Workout";
  return { kind: key < today ? "missed" : "planned", label: key < today ? "Missed" : "Planned", title, deload: entry.isDeloadWeek };
};

export const STATUS_STYLES = {
  done: { dot: "bg-forge-ember", chip: "bg-forge-ember text-[#160a02]", text: "text-orange-200" },
  planned: { dot: "border-2 border-forge-ember", chip: "border border-forge-ember/60 text-orange-100", text: "text-orange-200" },
  missed: { dot: "border-2 border-red-400", chip: "border border-red-400/50 text-red-200", text: "text-red-300" },
  rest: { dot: "bg-zinc-500", chip: "bg-white/[0.08] text-zinc-300", text: "text-zinc-400" },
  treatment: { dot: "bg-teal-400", chip: "bg-teal-400/15 text-teal-100", text: "text-teal-300" }
};
