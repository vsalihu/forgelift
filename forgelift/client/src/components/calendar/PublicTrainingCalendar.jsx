import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Moon, Sparkles } from "lucide-react";
import { calendarService } from "../../services/calendarService.js";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (value) => String(value).padStart(2, "0");
const toDateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
const todayKey = () => {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
};
const currentCursor = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
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

const DayCellIcon = ({ dayData, isPast }) => {
  if (!dayData) return null;

  if (dayData.completed) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forge-ember text-white shadow">
        <Dumbbell className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (dayData.type === "rest") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600/40 text-slate-200">
        <Moon className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (dayData.type === "treatment") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/30 text-teal-200">
        <HeartPulse className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (dayData.type === "planned_workout") {
    const missed = isPast;
    return (
      <span
        className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 ${
          missed ? "border-red-400/70 text-red-300" : "border-forge-ember text-orange-200"
        }`}
      >
        <Dumbbell className="h-3.5 w-3.5" />
        {dayData.isDeloadWeek ? (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-black">
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        ) : null}
      </span>
    );
  }

  return null;
};

const PublicTrainingCalendar = ({ username }) => {
  const [cursor, setCursor] = useState(currentCursor);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    calendarService
      .getPublicMonth(username, cursor.year, cursor.month)
      .then((data) => {
        if (cancelled) return;
        setDays(data.days || []);
      })
      .catch(() => {
        if (!cancelled) setHidden(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, cursor]);

  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const cells = buildMonthCells(cursor.year, cursor.month);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(cursor.year, cursor.month - 1, 1))
  );
  const today = todayKey();

  const goToMonth = (delta) => {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    });
  };

  if (hidden) return null;

  return (
    <section className="metal-panel rounded-xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white sm:text-xl">Training calendar · {monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous month"
            className="rounded-md p-2 text-slate-300 hover:bg-white/10"
            type="button"
            onClick={() => goToMonth(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next month"
            className="rounded-md p-2 text-slate-300 hover:bg-white/10"
            type="button"
            onClick={() => goToMonth(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div className="py-1" key={label}>
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
            <div
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border ${
                isToday ? "border-forge-ember bg-forge-ember/10" : "border-white/5 bg-black/20"
              }`}
              key={key}
            >
              <span className={`text-xs font-bold ${isToday ? "text-orange-200" : "text-slate-300"}`}>{dayNumber}</span>
              <DayCellIcon dayData={dayData} isPast={isPast} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-forge-ember" />
          Trained
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-forge-ember" />
          Planned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-red-400/70" />
          Missed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-600/40" />
          Rest
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-teal-500/30" />
          Treatment
        </span>
      </div>
    </section>
  );
};

export default PublicTrainingCalendar;
