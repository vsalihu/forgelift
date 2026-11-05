import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressRing from "./ProgressRing.jsx";
import { useDaily } from "../../context/DailyContext.jsx";
import { waterUnits } from "../../utils/dailyUtils.js";

const describe = (todo, imperial) => {
  if (todo.kind === "macro") return `${Math.round(todo.value)} / ${todo.target} g`;
  if (todo.kind === "water") {
    const units = waterUnits(imperial);
    return `${units.format(todo.value)} / ${units.format(todo.target)}`;
  }
  if (todo.kind === "meals" || (todo.kind === "supplement" && todo.target > 1)) return `${todo.value} / ${todo.target}`;
  return "";
};

// Dashboard glance at today's to-dos, linking to the full Today page.
const TodaySummaryCard = ({ imperial }) => {
  const { data } = useDaily() || {};
  if (!data) return null;
  const { completion, todos } = data;
  const allDone = completion.total > 0 && completion.done === completion.total;
  const open = todos.filter((todo) => !todo.done).slice(0, 3);

  return (
    <Link
      className="group flex items-center gap-4 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-orange-500/[0.09] via-white/[0.03] to-white/[0.01] p-4 transition-colors hover:border-orange-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:p-5"
      to="/today"
    >
      <ProgressRing done={allDone} size={76} stroke={8} value={completion.total ? completion.done / completion.total : 0}>
        <span className="text-lg font-bold tabular-nums text-white">
          {completion.done}
          <span className="text-xs text-zinc-500">/{completion.total}</span>
        </span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold text-white">
          Today
          {data.plan.isTrainingDay ? <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-orange-200">Training day</span> : null}
        </p>
        {data.needsSetup ? (
          <p className="mt-1 text-sm text-zinc-400">Set up your daily plan: protein, water, supplements and sleep, worked out for you.</p>
        ) : allDone ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
            <Check aria-hidden="true" className="h-4 w-4" />
            Everything done. Nice.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {open.map((todo) => (
              <li className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300" key={todo.key}>
                <span className="font-semibold text-white">{todo.kind === "checkin" ? "Check in" : todo.label}</span>
                {describe(todo, imperial) ? <span className="tabular-nums text-zinc-500"> {describe(todo, imperial)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-200" />
    </Link>
  );
};

export default TodaySummaryCard;
