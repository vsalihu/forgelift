// A ratio of two kinds of work on a centred scale: 1x in the middle, balanced zone shaded.
const RANGE = 1.5; // log2 units either side, so 0.35x to 2.8x
const position = (ratio) => {
  const value = Math.log2(Math.max(0.01, Number(ratio) || 1));
  return 50 + (Math.max(-RANGE, Math.min(RANGE, value)) / RANGE) * 50;
};

const describe = (ratio, left, right) => {
  const value = Number(ratio) || 0;
  if (!value) return "No data yet";
  if (value >= 1.25) return `${value.toFixed(1)}x more ${right}`;
  if (value <= 0.8) return `${(1 / value).toFixed(1)}x more ${left}`;
  return "Balanced";
};

const RatioGauge = ({ title, ratio, left, right, note }) => {
  const balanced = ratio >= 0.8 && ratio <= 1.25;
  const hasData = Number(ratio) > 0;
  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <span className="font-display text-2xl tabular-nums text-white">{hasData ? `${Number(ratio).toFixed(2)}x` : "–"}</span>
      </div>
      <p className={`mt-0.5 text-sm font-semibold ${!hasData ? "text-zinc-500" : balanced ? "text-emerald-300" : "text-amber-200"}`}>{describe(ratio, left, right)}</p>
      <div aria-hidden="true" className="relative mt-4 h-2 rounded-full bg-white/[0.08]">
        <div className="absolute inset-y-0 rounded-full bg-emerald-400/30" style={{ left: `${position(0.8)}%`, right: `${100 - position(1.25)}%` }} />
        <div className="absolute inset-y-[-3px] left-1/2 w-px bg-white/25" />
        {hasData ? (
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0d10] ${balanced ? "bg-emerald-300" : "bg-amber-300"}`}
            style={{ left: `${position(ratio)}%` }}
          />
        ) : null}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[0.7rem] text-zinc-500">
        <span>More {left}</span>
        <span>More {right}</span>
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-zinc-500">{note}</p> : null}
    </article>
  );
};

export default RatioGauge;
