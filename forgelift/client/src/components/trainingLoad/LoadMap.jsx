import { useEffect, useRef, useState } from "react";
import { tone as getTone } from "../advice/tones.js";
import { QUADRANTS, formatTrend, quadrantFor } from "./quadrants.js";

const X_MAX = 2; // ACWR
const Y_MAX = 15; // strength trend, percent either way
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const xPos = (acwr) => (clamp(acwr, 0, X_MAX) / X_MAX) * 100;
const yPos = (trend) => 50 - (clamp(trend, -Y_MAX, Y_MAX) / Y_MAX) * 50;

// Scatter of load ratio (x) against strength trend (y), one dot per muscle.
const LoadMap = ({ items }) => {
  const [active, setActive] = useState(null);
  const plotRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = plotRef.current;
    if (!node) return undefined;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = window.ResizeObserver ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [items.length]);
  const points = items.filter((item) => item.acwr !== null && item.acwr !== undefined && item.strengthTrendPercent !== null && item.strengthTrendPercent !== undefined);
  if (!points.length) return null;
  const showLabels = points.length <= 10;

  // Place each name beside its dot, on whichever side doesn't overlap a name already placed.
  // Boxes are in pixels from the measured plot size; label width is estimated from its length.
  const placed = [];
  const boxes = [];
  const width = size.width || 600;
  const height = size.height || 288;
  const overlaps = (box) => boxes.some((other) => box.x1 < other.x2 && box.x2 > other.x1 && box.y1 < other.y2 && box.y2 > other.y1);
  [...points]
    .sort((a, b) => b.strengthTrendPercent - a.strengthTrendPercent)
    .forEach((point) => {
      const x = xPos(point.acwr);
      const y = yPos(point.strengthTrendPercent);
      const px = (x / 100) * width;
      const py = (y / 100) * height;
      const labelWidth = point.muscleGroup.length * 6.4 + 4;
      const boxFor = (side) =>
        side === "right" ? { x1: px + 10, x2: px + 10 + labelWidth, y1: py - 8, y2: py + 8 } : { x1: px - 10 - labelWidth, x2: px - 10, y1: py - 8, y2: py + 8 };
      const fits = (side) => {
        const box = boxFor(side);
        return box.x1 >= 0 && box.x2 <= width && !overlaps(box);
      };
      const preferred = px > width * 0.65 ? "left" : "right";
      const other = preferred === "left" ? "right" : "left";
      const side = fits(preferred) ? preferred : fits(other) ? other : preferred;
      boxes.push(boxFor(side), { x1: px - 7, x2: px + 7, y1: py - 7, y2: py + 7 });
      placed.push({ point, x, y, side });
    });
  const legend = Object.entries(QUADRANTS).filter(([name]) => points.some((point) => point.quadrant === name));

  return (
    <figure>
      <div ref={plotRef} className="relative h-64 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/20 sm:h-72" role="img" aria-label={`Load map of ${points.length} muscles. Table below lists the values.`} onMouseLeave={() => setActive(null)}>
        <div aria-hidden="true" className="absolute inset-y-0 bg-emerald-400/[0.06]" style={{ left: `${xPos(0.8)}%`, width: `${xPos(1.3) - xPos(0.8)}%` }} />
        <span aria-hidden="true" className="absolute bottom-2 -translate-x-1/2 text-[0.65rem] font-semibold text-emerald-300/80" style={{ left: `${(xPos(0.8) + xPos(1.3)) / 2}%` }}>
          Sweet spot
        </span>
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
        <span aria-hidden="true" className="absolute left-2.5 top-2 text-[0.65rem] font-semibold text-zinc-500">↑ Getting stronger</span>
        <span aria-hidden="true" className="absolute left-2.5 top-1/2 mt-1 text-[0.65rem] font-semibold text-zinc-600">↓ Getting weaker</span>
        {placed.map(({ point, x, y, side }) => {
          const meta = quadrantFor(point.quadrant);
          const color = getTone(meta.tone).hex;
          const isActive = active === point.muscleGroup;
          return (
            <div
              className="absolute"
              key={point.muscleGroup}
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              onMouseEnter={() => setActive(point.muscleGroup)}
            >
              <span
                className="block rounded-full transition-transform"
                style={{ width: 12, height: 12, backgroundColor: color, boxShadow: `0 0 0 2px #0b0d10${isActive ? `, 0 0 14px ${color}` : ""}`, transform: isActive ? "scale(1.35)" : undefined }}
              />
              {showLabels || isActive ? (
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.7rem] font-semibold ${isActive ? "z-10 text-white" : "text-zinc-400"} ${side === "left" ? "right-4" : "left-4"}`}
                >
                  {point.muscleGroup}
                  {isActive ? <span className="text-zinc-500"> · {point.acwr} · {formatTrend(point.strengthTrendPercent)}</span> : null}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[0.65rem] font-semibold text-zinc-500">
        <span>← Lighter than usual</span>
        <span className="text-zinc-400">Load ratio</span>
        <span>Heavier than usual →</span>
      </div>
      <ul aria-label="Legend" className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {legend.map(([name, meta]) => (
          <li className="flex items-center gap-1.5 text-xs text-zinc-400" key={name}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getTone(meta.tone).hex }} />
            {meta.label}
          </li>
        ))}
      </ul>
      <div className="sr-only">
        <table>
          <caption>Load ratio and strength trend by muscle</caption>
          <thead>
            <tr>
              <th scope="col">Muscle</th>
              <th scope="col">Load ratio</th>
              <th scope="col">Strength trend</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.muscleGroup}>
                <th scope="row">{point.muscleGroup}</th>
                <td>{point.acwr}</td>
                <td>{formatTrend(point.strengthTrendPercent)}</td>
                <td>{quadrantFor(point.quadrant).label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default LoadMap;
