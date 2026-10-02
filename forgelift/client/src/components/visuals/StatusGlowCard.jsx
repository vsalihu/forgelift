const variants = {
  success: "border-emerald-400/20 bg-emerald-500/10 shadow-emerald-950/20",
  warning: "border-amber-400/25 bg-amber-500/10 shadow-amber-950/20",
  danger: "border-red-400/25 bg-red-500/10 shadow-red-950/20",
  info: "border-sky-400/20 bg-sky-500/10 shadow-sky-950/20",
  rank: "border-forge-copper/35 bg-forge-copper/10 shadow-orange-950/25",
  neutral: "border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] shadow-black/20"
};

const StatusGlowCard = ({ children, variant = "neutral", className = "", ...props }) => (
  <div className={`rounded-3xl border p-4 shadow-lg sm:p-5 ${variants[variant] || variants.neutral} ${className}`} {...props}>
    {children}
  </div>
);

export default StatusGlowCard;
