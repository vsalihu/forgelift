import { motion, useReducedMotion } from "framer-motion";

// Lead panel for an advice page: the one thing to know today.
const AdviceHero = ({ tourId, glow = "bg-forge-ember/20", className = "", children }) => {
  const reduce = useReducedMotion();
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-clip rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-5 sm:p-7 ${className}`}
      data-tour-id={tourId}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div aria-hidden="true" className={`pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full blur-3xl ${glow}`} />
      <div className="relative">{children}</div>
    </motion.section>
  );
};

export default AdviceHero;
