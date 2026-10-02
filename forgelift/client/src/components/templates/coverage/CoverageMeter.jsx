// One horizontal meter. Fills to 100% of the target; a flag past that marks too much.
const TONE = {
  none: "bg-transparent",
  light: "bg-orange-500/50",
  almost: "bg-orange-500/80",
  hit: "bg-gradient-to-r from-orange-400 to-forge-ember",
  over: "bg-amber-400"
};

const CoverageMeter = ({ fill, status, size = "md" }) => (
  <span aria-hidden="true" className={`relative block overflow-clip rounded-full bg-white/[0.07] ${size === "lg" ? "h-2.5" : "h-1.5"}`}>
    <span className={`block h-full rounded-full transition-[width] duration-500 ease-out ${TONE[status] || TONE.light}`} style={{ width: `${Math.min(fill, 1) * 100}%` }} />
  </span>
);

export const STATUS_TEXT = {
  none: "text-zinc-500",
  light: "text-zinc-400",
  almost: "text-orange-200",
  hit: "text-emerald-300",
  over: "text-amber-300"
};

export default CoverageMeter;
