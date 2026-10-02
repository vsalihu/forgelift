import { useEffect, useMemo, useRef } from "react";
import ChartCard from "./ChartCard.jsx";
import { formatLongDate, formatNumber } from "./format.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
// One hue, brighter = more sets, stepped for the dark panel.
const LEVELS = [
  { min: 1, color: "#6b2a0e", label: "1-12 sets" },
  { min: 13, color: "#a3400f", label: "13-20 sets" },
  { min: 21, color: "#d9560f", label: "21-28 sets" },
  { min: 29, color: "#fb923c", label: "29+ sets" }
];
const EMPTY = "rgba(255, 255, 255, 0.06)";

const levelFor = (sets) => [...LEVELS].reverse().find((level) => sets >= level.min);
const utcDay = (date) => {
  const day = new Date(date);
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
};

const ConsistencyHeatmap = ({ consistency }) => {
  const scrollRef = useRef(null);
  const { days = [], rangeStart, currentStreakWeeks = 0, bestStreakWeeks = 0, trainingDays = 0, workoutsPerWeek = 0 } = consistency || {};

  const { weeks, monthLabels } = useMemo(() => {
    const byDay = new Map(days.map((day) => [day.date, day]));
    const today = utcDay(new Date());
    const start = utcDay(rangeStart || today);
    const firstMonday = start - ((new Date(start).getUTCDay() + 6) % 7) * DAY_MS;
    const columns = [];
    const labels = [];
    let lastMonth = null;

    for (let weekStart = firstMonday; weekStart <= today; weekStart += 7 * DAY_MS) {
      const cells = Array.from({ length: 7 }, (_, index) => {
        const time = weekStart + index * DAY_MS;
        const key = new Date(time).toISOString().slice(0, 10);
        return { key, time, future: time > today, beforeRange: time < start, day: byDay.get(key) };
      });
      const month = new Date(weekStart).getUTCMonth();
      labels.push(month !== lastMonth ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(weekStart) : "");
      lastMonth = month;
      columns.push(cells);
    }
    // Drop a month label when the next one starts within 3 columns, so they never overlap.
    labels.forEach((label, index) => {
      if (label && labels.slice(index + 1, index + 3).some(Boolean)) labels[index] = "";
    });
    return { weeks: columns, monthLabels: labels };
  }, [days, rangeStart]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [weeks.length]);

  const stats = [
    ["Current streak", `${currentStreakWeeks} week${currentStreakWeeks === 1 ? "" : "s"}`],
    ["Best streak", `${bestStreakWeeks} week${bestStreakWeeks === 1 ? "" : "s"}`],
    ["Training days", formatNumber(trainingDays, 0)],
    ["Workouts per week", formatNumber(workoutsPerWeek)]
  ];

  return (
    <ChartCard
      title="Consistency"
      description="Every square is a day. The brighter it is, the more sets you did. A streak counts weeks in a row with at least one workout."
      empty={!days.length}
      emptyMessage="No workouts in this period yet."
      table={{
        columns: [
          { key: "date", label: "Date" },
          { key: "workouts", label: "Workouts" },
          { key: "sets", label: "Sets" }
        ],
        rows: [...days].reverse().map((day) => ({ date: formatLongDate(`${day.date}T12:00:00Z`), workouts: day.workouts, sets: day.sets }))
      }}
      footer={
        <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3" key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
              <dd className="mt-1 text-lg font-black text-white">{value}</dd>
            </div>
          ))}
        </dl>
      }
    >
      <div className="flex gap-2">
        <div className="grid shrink-0 grid-rows-[16px_repeat(7,12px)] gap-[3px] pt-px text-[10px] leading-3 text-zinc-500">
          <span />
          {WEEKDAYS.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        <div className="overflow-x-auto pb-2" ref={scrollRef}>
          <div className="flex w-max gap-[3px]">
            {weeks.map((cells, weekIndex) => (
              <div className="grid grid-rows-[16px_repeat(7,12px)] gap-[3px]" key={cells[0].key}>
                <span className="whitespace-nowrap text-[10px] leading-3 text-zinc-500">{monthLabels[weekIndex]}</span>
                {cells.map((cell) => {
                  if (cell.future || cell.beforeRange) return <span className="h-3 w-3" key={cell.key} />;
                  const sets = cell.day?.sets || 0;
                  const level = levelFor(sets);
                  const label = `${formatLongDate(cell.time)}: ${cell.day ? `${cell.day.workouts} workout${cell.day.workouts === 1 ? "" : "s"}, ${sets} sets` : "rest day"}`;
                  return (
                    <span
                      aria-label={label}
                      className="h-3 w-3 rounded-[3px]"
                      key={cell.key}
                      role="img"
                      style={{ background: level ? level.color : EMPTY }}
                      title={label}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px]" style={{ background: EMPTY }} title="Rest day" />
        {LEVELS.map((level) => (
          <span className="h-3 w-3 rounded-[3px]" key={level.label} style={{ background: level.color }} title={level.label} />
        ))}
        <span>More</span>
      </div>
    </ChartCard>
  );
};

export default ConsistencyHeatmap;
