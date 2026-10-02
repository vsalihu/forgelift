const TONES = {
  neutral: "border-white/[0.08] from-white/[0.045]",
  good: "border-emerald-400/20 from-emerald-400/[0.06]",
  warn: "border-amber-400/20 from-amber-400/[0.06]",
  accent: "border-forge-ember/25 from-forge-ember/[0.1]"
};

// One number with a label and an optional line of context. Tone is decoration; the sub line says it in words.
const StatTile = ({ label, value, sub, icon: Icon, tone = "neutral", className = "" }) => (
  <div className={`min-w-0 rounded-3xl border bg-gradient-to-b to-transparent p-4 ${TONES[tone] || TONES.neutral} ${className}`}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-zinc-400">{label}</p>
      {Icon ? <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-300" /> : null}
    </div>
    <p
      className={`font-display mt-1 line-clamp-2 leading-tight tabular-nums text-white [overflow-wrap:anywhere] ${
        String(value).length > 10 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
      }`}
    >
      {value}
    </p>
    {sub ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{sub}</p> : null}
  </div>
);

export default StatTile;
