import { ROLES, muscleImpacts } from "./exerciseMeta.js";

export const RoleLegend = ({ roles, className = "" }) => (
  <ul aria-label="Muscle roles" className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 ${className}`}>
    {roles.map((role) => (
      <li className="inline-flex items-center gap-1.5" key={role}>
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLES[role].color }} />
        {ROLES[role].label}
      </li>
    ))}
  </ul>
);

// Horizontal bars of how hard an exercise hits each muscle, coloured by role.
// `inline` renders spans only, so the bars can sit inside a button.
const MuscleImpactBars = ({ exercise, limit, compact = false, legend = true, inline = false }) => {
  const Wrap = inline ? "span" : "div";
  const List = inline ? "span" : "ul";
  const Item = inline ? "span" : "li";
  const Note = inline ? "span" : "p";
  const entries = muscleImpacts(exercise);
  const shown = limit ? entries.slice(0, limit) : entries;
  if (!shown.length) return <Note className="block text-sm text-zinc-500">No muscle data for this one.</Note>;
  const roles = Object.keys(ROLES).filter((role) => shown.some((entry) => entry.role === role));

  return (
    <Wrap className="block">
      {legend && roles.length > 1 && !inline ? <RoleLegend className="mb-3" roles={roles} /> : null}
      <List className={`block ${compact ? "space-y-1.5" : "space-y-2.5"}`}>
        {shown.map(({ muscle, value, role }) => (
          <Item className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-3 text-xs" key={muscle}>
            <span className="truncate font-semibold text-zinc-300">
              {muscle}
              <span className="sr-only">, {ROLES[role].label.toLowerCase()}</span>
            </span>
            <span aria-hidden="true" className={`block overflow-clip rounded-full bg-white/[0.06] ${compact ? "h-1.5" : "h-2"}`}>
              <span className="block h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: ROLES[role].color }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-zinc-400">{value}%</span>
          </Item>
        ))}
      </List>
      {limit && entries.length > limit ? <Note className="mt-2 block text-xs text-zinc-500">+{entries.length - limit} more</Note> : null}
    </Wrap>
  );
};

export default MuscleImpactBars;
