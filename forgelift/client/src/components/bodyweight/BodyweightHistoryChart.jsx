import { useState } from "react";

const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
const entryDate = (entry) => entry.recordedAt || entry.date || entry.createdAt;

// Bodyweight over time as a single line, scaled to the range you've actually moved in.
const BodyweightHistoryChart = ({ entries = [], unit = "kg" }) => {
  const [active, setActive] = useState(null);
  const ordered = [...entries]
    .filter((entry) => Number(entry.weight) > 0)
    .sort((a, b) => new Date(entryDate(a)) - new Date(entryDate(b)))
    .slice(-16);

  if (ordered.length < 2) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-200">History</p>
        <p className="mt-1 text-sm text-zinc-500">{ordered.length ? "Check in again next week to see your trend." : "No check-ins yet."}</p>
      </div>
    );
  }

  const weights = ordered.map((entry) => Number(entry.weight));
  const low = Math.min(...weights);
  const high = Math.max(...weights);
  const pad = Math.max(0.5, (high - low) * 0.15);
  const min = low - pad;
  const max = high + pad;
  const x = (index) => (index / (ordered.length - 1)) * 100;
  const y = (value) => 100 - ((value - min) / (max - min)) * 100;
  const path = ordered.map((entry, index) => `${index ? "L" : "M"}${x(index).toFixed(2)} ${y(Number(entry.weight)).toFixed(2)}`).join(" ");
  const shown = active ?? ordered.length - 1;
  const change = weights[weights.length - 1] - weights[0];

  return (
    <figure className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-200">History</span>
        <span className="text-xs tabular-nums text-zinc-500" aria-live="polite">
          <span className="font-bold text-zinc-200">
            {Number(ordered[shown].weight).toFixed(1)}
            {unit}
          </span>{" "}
          · {formatDate(entryDate(ordered[shown]))}
        </span>
      </figcaption>
      <div aria-hidden="true" className="relative mt-3 h-28" onMouseLeave={() => setActive(null)}>
        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d={`${path} L100 100 L0 100 Z`} fill="url(#bw-fill)" />
          <path d={path} fill="none" stroke="#fb923c" strokeLinejoin="round" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <defs>
            <linearGradient id="bw-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(249,115,22,0.22)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0d10] bg-orange-300"
          style={{ left: `${x(shown)}%`, top: `${y(Number(ordered[shown].weight))}%` }}
        />
        <div className="absolute inset-0 flex">
          {ordered.map((entry, index) => (
            <span className="h-full flex-1" key={entry._id || index} onMouseEnter={() => setActive(index)} />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex justify-between text-[0.7rem] text-zinc-500">
        <span>{formatDate(entryDate(ordered[0]))}</span>
        <span className={change > 0 ? "text-orange-200" : change < 0 ? "text-sky-200" : ""}>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}
          {unit} over {ordered.length} check-ins
        </span>
        <span>{formatDate(entryDate(ordered[ordered.length - 1]))}</span>
      </div>
      <div className="sr-only">
        <table>
          <caption>Bodyweight check-ins</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Weight ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((entry, index) => (
              <tr key={entry._id || index}>
                <td>{formatDate(entryDate(entry))}</td>
                <td>{entry.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default BodyweightHistoryChart;
