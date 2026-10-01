import { useMemo, useState } from "react";
import { formatNumber } from "../gym/gymUtils.js";

const WEEKS = 12;
const DAY = 24 * 60 * 60 * 1000;

const startOfWeek = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const offset = (value.getDay() + 6) % 7; // Monday start
  value.setDate(value.getDate() - offset);
  return value;
};

const weekLabel = (start) => start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const buildWeeks = (workouts, now = new Date()) => {
  const thisWeek = startOfWeek(now);
  const weeks = Array.from({ length: WEEKS }, (_, index) => {
    const start = new Date(thisWeek.getTime() - (WEEKS - 1 - index) * 7 * DAY);
    return { start, count: 0, volume: 0 };
  });
  workouts.forEach((workout) => {
    const start = startOfWeek(workout.date).getTime();
    const week = weeks.find((item) => item.start.getTime() === start);
    if (week) {
      week.count += 1;
      week.volume += workout.totalVolume || 0;
    }
  });
  return weeks;
};

// Consecutive weeks with at least one session, counting back from this week
// (or last week, so an untrained Monday doesn't break the streak).
export const weekStreak = (weeks) => {
  let index = weeks.length - 1;
  if (!weeks[index]?.count) index -= 1;
  let streak = 0;
  while (index >= 0 && weeks[index].count > 0) {
    streak += 1;
    index -= 1;
  }
  return streak;
};

const ConsistencyStrip = ({ workouts }) => {
  const weeks = useMemo(() => buildWeeks(workouts), [workouts]);
  const [hover, setHover] = useState(null);
  const max = Math.max(3, ...weeks.map((week) => week.count));
  const total = weeks.reduce((sum, week) => sum + week.count, 0);
  const active = hover ?? weeks.length - 1;
  const shown = weeks[active];

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-200">Sessions per week</span>
        <span className="text-xs tabular-nums text-zinc-500" aria-live="polite">
          {active === weeks.length - 1 ? "This week" : `Week of ${weekLabel(shown.start)}`}: <span className="font-bold text-zinc-200">{shown.count}</span>
          {shown.volume ? ` · ${formatNumber(shown.volume, 0)}kg` : ""}
        </span>
      </figcaption>
      <div
        aria-label={`${total} sessions in the last ${WEEKS} weeks`}
        className="relative mt-3 flex h-24 items-end gap-1.5 border-b border-white/10 sm:gap-2"
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        {weeks.map((week, index) => {
          const height = week.count ? Math.max(10, (week.count / max) * 100) : 0;
          const current = index === weeks.length - 1;
          return (
            <button
              aria-label={`Week of ${weekLabel(week.start)}: ${week.count} ${week.count === 1 ? "session" : "sessions"}`}
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center focus-visible:outline-none"
              key={week.start.toISOString()}
              tabIndex={-1}
              type="button"
              onFocus={() => setHover(index)}
              onMouseEnter={() => setHover(index)}
            >
              {week.count ? (
                <span
                  className={`block w-full max-w-[24px] rounded-t-[4px] transition-[height,background-color] duration-500 ${
                    hover === index || (hover === null && current) ? "bg-[#f97316]" : "bg-[#f97316]/55 group-hover:bg-[#f97316]"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ) : (
                <span className="block h-1 w-full max-w-[24px] rounded-full bg-white/[0.07]" />
              )}
            </button>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[0.7rem] text-zinc-500">
        <span>{weekLabel(weeks[0].start)}</span>
        <span>This week</span>
      </div>
      <div className="sr-only">
        <table>
          <caption>Sessions per week, last {WEEKS} weeks</caption>
          <thead>
            <tr>
              <th scope="col">Week of</th>
              <th scope="col">Sessions</th>
              <th scope="col">Volume (kg)</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.start.toISOString()}>
                <td>{weekLabel(week.start)}</td>
                <td>{week.count}</td>
                <td>{Math.round(week.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default ConsistencyStrip;
