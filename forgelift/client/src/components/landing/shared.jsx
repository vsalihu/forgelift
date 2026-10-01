import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

export const EASE = [0.16, 1, 0.3, 1];

export const RANK_ORDER = ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Warrior", "Ultimate"];

export const rankSrc = (rank) => `/ranks/${rank.toLowerCase()}.png`;

// Fades content up the first time it scrolls into view.
export const Reveal = ({ as = "div", delay = 0, y = 28, className = "", children, ...props }) => {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      viewport={{ once: true, amount: 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
      {...props}
    >
      {children}
    </Component>
  );
};

// Primary call to action. Dark text on ember keeps contrast above 7:1. Pulls gently toward the cursor.
export const PrimaryCta = ({ className = "", size = "lg" }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });

  const handleMove = (event) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.22);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.3);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const sizing = size === "sm" ? "min-h-10 px-4 text-sm" : "min-h-14 px-7 text-base";

  return (
    <motion.div className={`inline-flex ${className}`} style={{ x, y }} onPointerLeave={reset} onPointerMove={handleMove} ref={ref}>
      <Link
        className={`group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-b from-orange-400 to-forge-ember font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_12px_40px_-10px_rgba(249,115,22,0.85)] transition-[transform,box-shadow] duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_60px_-8px_rgba(249,115,22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a] active:scale-[0.98] ${sizing}`}
        to="/register"
      >
        Start training free
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
};

export const SecondaryCta = ({ className = "", size = "lg" }) => {
  const sizing = size === "sm" ? "min-h-10 px-4 text-sm" : "min-h-14 px-7 text-base";
  return (
    <Link
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] font-bold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a] active:scale-[0.98] ${sizing} ${className}`}
      to="/login"
    >
      Log in
    </Link>
  );
};

// Small caption that marks preview numbers as illustrative.
export const ExampleNote = ({ className = "" }) => (
  <p className={`text-xs text-zinc-500 ${className}`}>Example data, for illustration.</p>
);
