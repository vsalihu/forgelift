import { BookIcon, FlameIcon, GoalIcon, MealIcon, SleepIcon, StepsIcon, StretchIcon, SuccessIcon, SupplementIcon, WaterDropIcon } from "../icons/featureIcons.jsx";
import { DumbbellIcon, RecoveryIcon } from "../icons/navIcons.jsx";

// Icon and colour choices for the user's own to-dos. Keys match what the server accepts.
export const TODO_ICONS = {
  check: [SuccessIcon, "Check"],
  steps: [StepsIcon, "Steps"],
  book: [BookIcon, "Book"],
  stretch: [StretchIcon, "Stretch"],
  flame: [FlameIcon, "Flame"],
  water: [WaterDropIcon, "Water"],
  meal: [MealIcon, "Meal"],
  sleep: [SleepIcon, "Sleep"],
  supplement: [SupplementIcon, "Pill"],
  dumbbell: [DumbbellIcon, "Dumbbell"],
  goal: [GoalIcon, "Target"],
  heart: [RecoveryIcon, "Heart"]
};

// Colours are decoration only; every state is also said in text.
export const TODO_COLORS = {
  ember: { label: "Orange", tile: "bg-orange-500/15 text-orange-200 border-orange-400/25", swatch: "bg-orange-500", bar: "from-orange-300 to-forge-ember" },
  amber: { label: "Amber", tile: "bg-amber-400/15 text-amber-200 border-amber-300/25", swatch: "bg-amber-400", bar: "from-amber-200 to-amber-400" },
  emerald: { label: "Green", tile: "bg-emerald-400/15 text-emerald-200 border-emerald-300/25", swatch: "bg-emerald-400", bar: "from-emerald-200 to-emerald-400" },
  sky: { label: "Blue", tile: "bg-sky-400/15 text-sky-200 border-sky-300/25", swatch: "bg-sky-400", bar: "from-sky-200 to-sky-400" },
  violet: { label: "Violet", tile: "bg-violet-400/15 text-violet-200 border-violet-300/25", swatch: "bg-violet-400", bar: "from-violet-200 to-violet-400" },
  rose: { label: "Rose", tile: "bg-rose-400/15 text-rose-200 border-rose-300/25", swatch: "bg-rose-400", bar: "from-rose-200 to-rose-400" }
};

export const REPEATS = [
  ["daily", "Every day"],
  ["training", "Training days"],
  ["rest", "Rest days"],
  ["days", "Some days"],
  ["once", "Just today"]
];
export const WEEKDAYS = [
  [1, "M", "Monday"],
  [2, "T", "Tuesday"],
  [3, "W", "Wednesday"],
  [4, "T", "Thursday"],
  [5, "F", "Friday"],
  [6, "S", "Saturday"],
  [0, "S", "Sunday"]
];

export const repeatLabel = (todo) => {
  if (todo.repeat === "days") {
    const names = WEEKDAYS.filter(([day]) => (todo.days || []).includes(day)).map(([, , name]) => name.slice(0, 3));
    return names.length === 7 ? "Every day" : names.join(", ");
  }
  if (todo.repeat === "once") return "Just today";
  return REPEATS.find(([key]) => key === todo.repeat)?.[1] || "Every day";
};

// One tap's worth for a counted to-do: big targets move faster.
export const countStep = (target) => (target >= 5000 ? 1000 : target >= 1000 ? 250 : target >= 200 ? 50 : target >= 50 ? 10 : target >= 20 ? 5 : 1);

export const SUGGESTIONS = [
  { label: "10,000 steps", kind: "count", target: 10000, unit: "steps", icon: "steps", color: "sky" },
  { label: "Stretch 10 min", kind: "check", icon: "stretch", color: "emerald" },
  { label: "Read", kind: "count", target: 10, unit: "pages", icon: "book", color: "violet" },
  { label: "Fruit and veg", kind: "count", target: 5, unit: "servings", icon: "meal", color: "emerald" },
  { label: "Walk after dinner", kind: "check", icon: "steps", color: "amber" },
  { label: "Pack the gym bag", kind: "check", icon: "dumbbell", color: "ember", repeat: "training" },
  { label: "No alcohol", kind: "check", icon: "heart", color: "rose" },
  { label: "Screens off 30 min before bed", kind: "check", icon: "sleep", color: "violet" }
];

export const formatCount = (value) => Math.round(value).toLocaleString("en-US");
