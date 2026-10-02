import { ROLES } from "../exercises/exerciseMeta.js";

const fmt = (value) => (Math.round(value * 10) / 10).toString();

// Sets each muscle gets from the workout. One colour: it's a single measure, labelled with its value.
const MuscleCoverage = ({ entries, limit = 8 }) => {
  if (!entries.length) {
    return <p className="text-sm text-zinc-500">Add exercises to see which muscles this workout trains.</p>;
  }
  const shown = entries.slice(0, limit);
  const max = Math.max(...shown.map((entry) => entry.sets), 1);

  return (
    <div>
      <ul className="space-y-2">
        {shown.map((entry) => (
          <li className="grid grid-cols-[minmax(0,7rem)_1fr_3.25rem] items-center gap-3 text-xs" key={entry.muscle}>
            <span className="truncate font-semibold text-zinc-300">{entry.muscle}</span>
            <span aria-hidden="true" className="block h-2 overflow-clip rounded-full bg-white/[0.06]">
              <span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${(entry.sets / max) * 100}%`, backgroundColor: ROLES.primary.color }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-zinc-300">{fmt(entry.sets)} {fmt(entry.sets) === "1" ? "set" : "sets"}</span>
          </li>
        ))}
      </ul>
      {entries.length > limit ? <p className="mt-2 text-xs text-zinc-500">+{entries.length - limit} smaller</p> : null}
      <p className="mt-3 text-xs leading-5 text-zinc-500">A set counts in full for its main muscle and partly for the muscles that help.</p>
    </div>
  );
};

export default MuscleCoverage;
