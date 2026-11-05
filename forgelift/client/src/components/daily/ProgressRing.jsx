import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

// Circular progress. value is 0-1; children sit in the middle.
const ProgressRing = ({ value, size = 120, stroke = 10, done = false, children }) => {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value || 0));
  const id = `ring${useId().replace(/:/g, "")}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg aria-hidden="true" className="-rotate-90" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={done ? "#6ee7b7" : "#fdba74"} />
            <stop offset="100%" stopColor={done ? "#10b981" : "#f97316"} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} fill="none" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <motion.circle
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={reduce ? false : { strokeDashoffset: circumference }}
          r={r}
          stroke={`url(#${id})`}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={stroke}
          transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

export default ProgressRing;
