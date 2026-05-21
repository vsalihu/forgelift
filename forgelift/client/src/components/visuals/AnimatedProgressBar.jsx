import { motion, useReducedMotion } from "framer-motion";

const variants = {
  success: "from-emerald-400 to-green-300",
  warning: "from-amber-400 to-orange-300",
  danger: "from-red-500 to-orange-400",
  info: "from-sky-400 to-cyan-300",
  rank: "from-forge-copper to-forge-ember",
  neutral: "from-slate-400 to-slate-200"
};

const AnimatedProgressBar = ({ value = 0, max = 100, label, showPercentage = true, variant = "neutral", className = "" }) => {
  const reducedMotion = useReducedMotion();
  const percentage = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / (Number(max) || 100)) * 100)));

  return (
    <div className={className}>
      {(label || showPercentage) ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label ? <span className="font-semibold text-slate-300">{label}</span> : <span />}
          {showPercentage ? <span className="font-bold text-white">{percentage}%</span> : null}
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${variants[variant] || variants.neutral}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
