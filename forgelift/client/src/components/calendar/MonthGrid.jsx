import { ChevronLeft, ChevronRight } from "lucide-react";
import { DeloadWeekIcon, PhysioIcon, RestDayIcon } from "../icons/featureIcons.jsx";
import { DumbbellIcon } from "../icons/navIcons.jsx";
import { STATUS_STYLES, dayStatus, toDateKey, todayKey } from "./calendarUtils.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const buildMonthCells = (year, month) => {
  const first = new Date(year, month - 1, 1).getDay();
  const leading = first === 0 ? 6 : first - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toDateKey(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const StatusMark = ({ status }) => {
  if (!status) return null;
  const Icon = status.kind === "rest" ? RestDayIcon : status.kind === "treatment" ? PhysioIcon : DumbbellIcon;
  const filled = status.kind === "done";
  return (
    <span
      className={`relative flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7 ${
        filled ? "bg-forge-ember text-[#160a02] shadow-[0_0_14px_-2px_rgba(249,115,22,0.8)]" : status.kind === "planned" ? "border-2 border-forge-ember text-orange-200" : status.kind === "missed" ? "border-2 border-red-400/80 text-red-300" : status.kind === "treatment" ? "bg-teal-400/20 text-teal-200" : "bg-white/[0.08] text-zinc-300"
      }`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {status.deload ? (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-300 text-black">
          <DeloadWeekIcon aria-hidden="true" className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </span>
  );
};

const MonthGrid = ({ year, month, daysByDate, loading, onPrevMonth, onNextMonth, onToday, onSelectDate }) => {
  const cells = buildMonthCells(year, month);
  const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = todayKey();
  const tally = { done: 0, planned: 0, missed: 0, rest: 0, treatment: 0 };
  cells.forEach((key) => {
    const status = key ? dayStatus(daysByDate.get(key), key, today) : null;
    if (status) tally[status.kind] += 1;
  });
  const isCurrentMonth = today.startsWith(toDateKey(year, month, 1).slice(0, 7));

  return (
    <section aria-labelledby="month-label" className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-2xl text-white" id="month-label">
            {label}
          </h2>
          <p className="mt-0.5 text-sm tabular-nums text-zinc-500">
            {tally.done} done · {tally.planned} planned{tally.missed ? ` · ${tally.missed} missed` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onPrevMonth}>
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            className="min-h-10 rounded-full px-4 text-sm font-bold text-zinc-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
            disabled={isCurrentMonth}
            type="button"
            onClick={onToday}
          >
            Today
          </button>
          <button aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onNextMonth}>
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-1 text-center text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500 sm:text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 transition-opacity sm:gap-1.5 ${loading ? "opacity-50" : ""}`}>
        {cells.map((key, index) => {
          if (!key) return <div className="aspect-square sm:aspect-auto sm:min-h-24" key={`blank-${index}`} />;
          const status = dayStatus(daysByDate.get(key), key, today);
          const isToday = key === today;
          const day = Number(key.slice(-2));
          const date = new Date(year, month - 1, day);
          return (
            <button
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${status ? `, ${status.label.toLowerCase()}: ${status.title}` : ""}`}
              className={`group flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:aspect-auto sm:min-h-24 sm:items-stretch sm:justify-start sm:p-2 ${
                isToday ? "border-forge-ember/60 bg-forge-ember/[0.08]" : key < today ? "border-white/[0.04] bg-black/20 hover:bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
            >
              <span className={`text-xs font-bold tabular-nums sm:text-sm ${isToday ? "text-orange-200" : key < today ? "text-zinc-500" : "text-zinc-300"}`}>{day}</span>
              <span className="sm:hidden">
                <StatusMark status={status} />
              </span>
              {status ? (
                <span className={`hidden min-w-0 items-center gap-1.5 sm:flex`}>
                  <StatusMark status={status} />
                  <span className={`min-w-0 truncate text-xs font-semibold ${STATUS_STYLES[status.kind].text}`}>{status.title}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <ul aria-label="Legend" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-zinc-400">
        {[
          ["done", "Done"],
          ["planned", "Planned"],
          ["missed", "Missed"],
          ["rest", "Rest"],
          ["treatment", "Treatment"]
        ].map(([kind, text]) => (
          <li className="inline-flex items-center gap-1.5" key={kind}>
            <span aria-hidden="true" className={`h-3 w-3 rounded-full ${STATUS_STYLES[kind].dot}`} />
            {text}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <DeloadWeekIcon aria-hidden="true" className="h-3.5 w-3.5 text-amber-300" />
          Deload week
        </li>
      </ul>
    </section>
  );
};

export default MonthGrid;
