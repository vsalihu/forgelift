import { useState } from "react";
import { formatNumber } from "../gym/gymUtils.js";

// Validated together on the dark surface (lightness band, chroma, CVD and contrast all pass).
const SEGMENTS = [
  { key: "directLoad", label: "Direct", color: "#d95926" },
  { key: "indirectLoad", label: "Indirect", color: "#3987e5" },
  { key: "stabiliserLoad", label: "Stabiliser", color: "#199e70" }
];
const COLLAPSED = 8;

const MuscleLoadChart = ({ summary = {} }) => {
  const [active, setActive] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const rows = Object.entries(summary)
    .map(([muscle, load]) => ({ muscle, ...load, totalLoad: load?.totalLoad || 0 }))
    .filter((row) => row.totalLoad > 0)
    .sort((a, b) => b.totalLoad - a.totalLoad);

  if (!rows.length) return <p className="text-sm text-zinc-500">No muscle load was recorded for this session.</p>;

  const max = rows[0].totalLoad;
  const shown = expanded ? rows : rows.slice(0, COLLAPSED);

  return (
    <figure>
      <ul aria-label="Legend" className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENTS.map((segment) => (
          <li className="flex items-center gap-1.5 text-xs text-zinc-400" key={segment.key}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </li>
        ))}
      </ul>
      <ol aria-hidden="true" className="space-y-1" onMouseLeave={() => setActive(null)}>
        {shown.map((row) => {
          const isActive = active === row.muscle;
          const parts = SEGMENTS.map((segment) => ({ ...segment, value: row[segment.key] || 0 })).filter((part) => part.value > 0);
          const visibleParts = parts.length ? parts : [{ ...SEGMENTS[0], value: row.totalLoad }];
          return (
            <li
              className={`rounded-xl px-2 py-1.5 transition-colors ${isActive ? "bg-white/[0.05]" : ""}`}
              key={row.muscle}
              onMouseEnter={() => setActive(row.muscle)}
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-zinc-200">{row.muscle}</span>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {isActive
                    ? parts.map((part) => `${part.label} ${formatNumber(part.value, 0)}`).join(" · ")
                    : `${row.loadLevel ? `${row.loadLevel} · ` : ""}${formatNumber(row.totalLoad, 0)}`}
                </span>
              </div>
              <div className="mt-1.5 flex h-3 gap-[2px]" style={{ width: `${Math.max(4, (row.totalLoad / max) * 100)}%` }}>
                {visibleParts.map((part, index) => (
                  <span
                    className={index === visibleParts.length - 1 ? "rounded-r-[4px]" : ""}
                    key={part.key}
                    style={{ backgroundColor: part.color, flexGrow: part.value, flexBasis: 0, minWidth: 3 }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length > COLLAPSED ? (
        <button
          aria-expanded={expanded}
          className="mt-3 text-sm font-semibold text-orange-300 hover:text-orange-200"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show all ${rows.length} muscles`}
        </button>
      ) : null}
      <div className="sr-only">
        <table>
          <caption>Muscle load by type for this workout</caption>
          <thead>
            <tr>
              <th scope="col">Muscle</th>
              {SEGMENTS.map((segment) => (
                <th key={segment.key} scope="col">
                  {segment.label}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.muscle}>
                <th scope="row">{row.muscle}</th>
                {SEGMENTS.map((segment) => (
                  <td key={segment.key}>{Math.round(row[segment.key] || 0)}</td>
                ))}
                <td>{Math.round(row.totalLoad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default MuscleLoadChart;
