import { ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Moon, Plus, Sparkles } from "lucide-react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (value) => String(value).padStart(2, "0");
const toDateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
const todayKey = () => {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

const buildMonthCells = (year, month) => {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstOfMonth.getUTCDay();
  const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toDateKey(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const CellIcon = ({ dayData, isPast }) => {
  if (dayData?.workouts?.length) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forge-ember text-white shadow">
        <Dumbbell className="h-3.5 w-3.5" />
      </span>
    );
  }

  const entry = dayData?.entry;
  if (!entry) return null;

  if (entry.type === "rest") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600/40 text-slate-200">
        <Moon className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (entry.type === "treatment") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/30 text-teal-200">
        <HeartPulse className="h-3.5 w-3.5" />
      </span>
    );
  }

  const missed = isPast;
  return (
    <span
      className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 ${
        missed ? "border-red-400/70 text-red-300" : "border-forge-ember text-orange-200"
      }`}
    >
      <Dumbbell className="h-3.5 w-3.5" />
      {entry.isDeloadWeek ? (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-black">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </span>
  );
};

const CalendarGrid = ({ year, month, daysByDate, loading, onPrevMonth, onNextMonth, onToday, onSelectDate }) => {
  const cells = buildMonthCells(year, month);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, 1)));
  const today = todayKey();

  return (
    <section className="metal-panel rounded-xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white sm:text-xl">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10" type="button" onClick={onToday}>
            Today
          </button>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
        {cells.map((key, index) => {
          if (!key) return <div className="aspect-square" key={`blank-${index}`} />;
          const dayData = daysByDate.get(key);
          const dayNumber = Number(key.slice(-2));
          const isToday = key === today;
          const isPast = key < today;

          return (
            <button
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border transition ${
                isToday ? "border-forge-ember bg-forge-ember/10" : "border-white/5 bg-black/20 hover:bg-white/5"
              }`}
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
            >
              <span className={`text-xs font-bold ${isToday ? "text-orange-200" : "text-slate-300"}`}>{dayNumber}</span>
              {dayData ? (
                <CellIcon dayData={dayData} isPast={isPast} />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-forge-ember" />Completed</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-forge-ember" />Planned</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-red-400/70" />Missed</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-600/40" />Rest</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-teal-500/30" />Treatment</span>
        <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-amber-400" />Deload week</span>
      </div>
    </section>
  );
};

export default CalendarGrid;
