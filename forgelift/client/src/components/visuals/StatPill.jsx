const variants = {
  success: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
  warning: "bg-amber-500/15 text-amber-200 ring-amber-400/20",
  danger: "bg-red-500/15 text-red-200 ring-red-400/20",
  info: "bg-sky-500/15 text-sky-200 ring-sky-400/20",
  rank: "bg-forge-ember/15 text-orange-200 ring-forge-copper/25",
  neutral: "bg-white/10 text-slate-200 ring-white/10"
};

const StatPill = ({ children, icon: Icon, variant = "neutral", className = "" }) => (
  <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${variants[variant] || variants.neutral} ${className}`}>
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {children}
  </span>
);

export default StatPill;
