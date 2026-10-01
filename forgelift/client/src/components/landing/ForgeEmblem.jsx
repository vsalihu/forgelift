import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { EASE, rankSrc } from "./shared.jsx";

// Deterministic pseudo-random numbers so the ember layout is stable between renders.
const seeded = (seed) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

export const EmberField = ({ count = 40 }) => {
  const embers = useMemo(() => {
    const random = seeded(42);
    return Array.from({ length: count }, (_, index) => {
      const size = 2.5 + random() * 4.5;
      return {
        id: index,
        style: {
          left: `${12 + random() * 76}%`,
          bottom: `${8 + random() * 22}%`,
          width: `${size}px`,
          height: `${size}px`,
          "--dur": `${6 + random() * 7}s`,
          "--delay": `${-random() * 12}s`,
          "--drift": `${(random() - 0.5) * 120}px`,
          "--rise": `${260 + random() * 340}px`,
          "--peak": `${0.65 + random() * 0.35}`
        }
      };
    });
  }, [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {embers.map((ember) => (
        <span className="ember" key={ember.id} style={ember.style} />
      ))}
    </div>
  );
};

// Glow, rings, molten arcs, the rank badge and embers. Fills its (square) parent.
export const EmblemCore = ({ rank, badgeStyle, glowStyle, embers = 40 }) => (
  <>
    <motion.div
      aria-hidden="true"
      className="landing-glow-pulse absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.6),rgba(249,115,22,0.14)_45%,transparent_70%)] blur-2xl"
      style={glowStyle}
    />
    <div aria-hidden="true" className="absolute inset-[4%] rounded-full border border-white/[0.05]" />
    <div
      aria-hidden="true"
      className="absolute inset-[15%] rounded-full border border-white/[0.08] bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.07),rgba(10,11,14,0.6)_62%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_120px_-30px_rgba(249,115,22,0.45)]"
    />
    <div aria-hidden="true" className="forge-arc absolute inset-[4%]" />
    <div aria-hidden="true" className="forge-arc forge-arc--slow absolute inset-[15%]" />

    <motion.div className="absolute inset-[25%]" style={badgeStyle}>
      <AnimatePresence initial={false}>
        <motion.img
          alt={`${rank} rank badge`}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(249,115,22,0.35)]"
          exit={{ opacity: 0, scale: 1.12, filter: "blur(10px)" }}
          height="320"
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          key={rank}
          src={rankSrc(rank)}
          transition={{ duration: 0.8, ease: EASE }}
          width="320"
        />
      </AnimatePresence>
    </motion.div>

    <EmberField count={embers} />
  </>
);
