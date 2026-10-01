import { PhysioIcon, RestDayIcon } from "../icons/featureIcons.jsx";
import { DumbbellIcon } from "../icons/navIcons.jsx";
import { STATUS_STYLES, addDaysToKey, dayStatus, keyToLocalDate, todayKey } from "./calendarUtils.js";

// The next seven days at a glance; tap a day to plan or review it.
const UpNext = ({ daysByDate, onSelectDate }) => {
  const today = todayKey();
  const keys = Array.from({ length: 7 }, (_, index) => addDaysToKey(today, index));

  return (
    <section aria-labelledby="up-next" className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-zinc-300" id="up-next">
        Next 7 days
      </h2>
      <ol className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0">
        {keys.map((key, index) => {
          const status = dayStatus(daysByDate.get(key), key, today);
          const date = keyToLocalDate(key);
          const Icon = status?.kind === "rest" ? RestDayIcon : status?.kind === "treatment" ? PhysioIcon : DumbbellIcon;
          return (
            <li className="w-[6.5rem] shrink-0 sm:w-auto" key={key}>
              <button
                className={`flex h-full min-h-[7.5rem] w-full flex-col rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  index === 0 ? "border-forge-ember/50 bg-forge-ember/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]"
                }`}
                type="button"
                onClick={() => onSelectDate(key)}
              >
                <span className={`text-xs font-bold uppercase tracking-wide ${index === 0 ? "text-orange-300" : "text-zinc-500"}`}>
                  {index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="font-display text-2xl leading-tight tabular-nums text-white">{date.getDate()}</span>
                {status ? (
                  <span className="mt-auto min-w-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${STATUS_STYLES[status.kind].chip}`}>
                      <Icon aria-hidden="true" className="h-3 w-3" />
                      {status.label}
                    </span>
                    <span className="mt-1 block truncate text-xs text-zinc-400">{status.kind === "rest" || status.kind === "treatment" ? "" : status.title}</span>
                  </span>
                ) : (
                  <span className="mt-auto text-xs text-zinc-600">Nothing planned</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default UpNext;
