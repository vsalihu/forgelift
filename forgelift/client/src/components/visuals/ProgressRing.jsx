import { motion, useReducedMotion } from "framer-motion";

const variants = {
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-red-300",
  info: "text-sky-300",
  rank: "text-forge-copper",
  neutral: "text-slate-300"
};

const trackVariants = {
  success: "stroke-emerald-500/15",
  warning: "stroke-amber-500/15",
  danger: "stroke-red-500/15",
  info: "stroke-sky-500/15",
  rank: "stroke-forge-copper/15",
  neutral: "stroke-white/10"
};

const strokeVariants = {
  success: "stroke-emerald-400",
  warning: "stroke-amber-400",
  danger: "stroke-red-400",
  info: "stroke-sky-400",
  rank: "stroke-forge-ember",
  neutral: "stroke-slate-300"
};

const ProgressRing = ({ value = 0, max = 100, label, sublabel, size = 112, variant = "neutral", className = "" }) => {
  const reducedMotion = useReducedMotion();
  const numericMax = Number(max) || 100;
  const percentage = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / numericMax) * 100)));
  const strokeWidth = Math.max(8, Math.round(size * 0.08));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ height: size, width: size }}>
      <svg className="-rotate-90" height={size} width={size}>
        <circle
          className={trackVariants[variant] || trackVariants.neutral}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          className={strokeVariants[variant] || strokeVariants.neutral}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          r={radius}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span className={`text-xl font-black ${variants[variant] || variants.neutral}`}>{percentage}%</span>
        {label ? <span className="mt-0.5 max-w-full truncate text-[11px] font-bold uppercase tracking-[0.12em] text-white">{label}</span> : null}
        {sublabel ? <span className="mt-0.5 max-w-full truncate text-[10px] text-slate-400">{sublabel}</span> : null}
      </div>
    </div>
  );
};

export default ProgressRing;
