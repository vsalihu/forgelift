const Badge = ({ children, tone = "neutral" }) => {
  const tones = {
    neutral: "bg-white/10 text-slate-200",
    orange: "bg-forge-ember/15 text-orange-200",
    green: "bg-green-500/10 text-green-200",
    red: "bg-red-500/10 text-red-200",
    yellow: "bg-yellow-500/10 text-yellow-200"
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[tone] || tones.neutral}`}>{children}</span>;
};

export default Badge;
