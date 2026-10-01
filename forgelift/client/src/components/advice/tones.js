// Status tones for the training-advice pages. Status colour always ships with a label.
export const TONES = {
  good: { chip: "bg-emerald-500/12 text-emerald-200 border-emerald-400/25", bar: "bg-emerald-400", text: "text-emerald-300", glow: "bg-emerald-400/20", hex: "#34d399" },
  caution: { chip: "bg-amber-400/10 text-amber-100 border-amber-300/25", bar: "bg-amber-300", text: "text-amber-200", glow: "bg-amber-300/20", hex: "#fcd34d" },
  serious: { chip: "bg-orange-500/12 text-orange-100 border-orange-400/30", bar: "bg-orange-400", text: "text-orange-300", glow: "bg-orange-400/20", hex: "#fb923c" },
  critical: { chip: "bg-red-500/12 text-red-100 border-red-400/30", bar: "bg-red-400", text: "text-red-300", glow: "bg-red-400/20", hex: "#f87171" },
  info: { chip: "bg-sky-500/10 text-sky-100 border-sky-400/25", bar: "bg-sky-400", text: "text-sky-300", glow: "bg-sky-400/20", hex: "#38bdf8" },
  neutral: { chip: "bg-white/[0.06] text-zinc-300 border-white/10", bar: "bg-zinc-400", text: "text-zinc-300", glow: "bg-white/10", hex: "#a1a1aa" }
};

export const tone = (name) => TONES[name] || TONES.neutral;

export const severityTone = (severity) => ({ Low: "neutral", Medium: "caution", High: "serious", Critical: "critical" })[severity] || "neutral";
