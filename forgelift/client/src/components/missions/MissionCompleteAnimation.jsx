import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { FlameIcon, SuccessIcon } from "../icons/featureIcons.jsx";

const Burst = () => {
  const sparks = useMemo(() => Array.from({ length: 14 }, (_, index) => ({ angle: (index / 14) * Math.PI * 2, distance: 70 + (index % 3) * 18 })), []);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[4.5rem] h-0 w-0">
      {sparks.map((spark, index) => (
        <motion.span
          animate={{ x: Math.cos(spark.angle) * spark.distance, y: Math.sin(spark.angle) * spark.distance, opacity: [0, 1, 0], scale: [0.6, 1, 0.4] }}
          className="absolute h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_10px_2px_rgba(251,146,60,0.8)]"
          initial={{ x: 0, y: 0, opacity: 0 }}
          key={index}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const MissionCompleteAnimation = ({ missions = [], onClose }) => {
  const reduce = useReducedMotion();
  const open = missions.length > 0;
  const totalXp = missions.reduce((sum, mission) => sum + (Number(mission.xpReward) || 0), 0);
  const [shownXp, setShownXp] = useState(0);
  const buttonRef = useRef(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    buttonRef.current?.focus();
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    let controls;
    if (reduce) setShownXp(totalXp);
    else controls = animate(0, totalXp, { duration: 0.9, delay: 0.25, onUpdate: (value) => setShownXp(Math.round(value)) });
    return () => {
      controls?.stop();
      document.removeEventListener("keydown", onKey);
    };
  }, [open, totalXp, reduce, onClose]);

  if (!open) return null;

  return (
    <div aria-labelledby="mission-complete-title" aria-modal="true" className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog">
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-clip rounded-[2rem] border border-emerald-400/25 bg-[#0c1110] p-6 text-center shadow-[0_0_80px_-20px_rgba(52,211,153,0.5)]"
        initial={reduce ? false : { opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(52,211,153,0.25),transparent_70%)]" />
        {reduce ? null : <Burst />}
        <motion.div
          animate={{ scale: 1, rotate: 0 }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/15 text-emerald-300"
          initial={reduce ? false : { scale: 0.3, rotate: -30 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <SuccessIcon className="h-10 w-10" />
        </motion.div>
        <h2 className="font-display relative mt-5 text-3xl text-white" id="mission-complete-title">
          {missions.length === 1 ? "Mission complete." : `${missions.length} missions complete.`}
        </h2>
        <ul className="relative mt-3 space-y-1.5">
          {missions.map((mission) => (
            <li className="text-sm text-zinc-300" key={mission._id || mission.title}>
              {mission.title}
            </li>
          ))}
        </ul>
        <p className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-forge-ember/15 px-5 py-2 text-lg font-black tabular-nums text-orange-100">
          <FlameIcon className="h-5 w-5" />+{shownXp} XP
        </p>
        <button
          className="relative mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          ref={buttonRef}
          type="button"
          onClick={onClose}
        >
          Keep going
        </button>
      </motion.div>
    </div>
  );
};

export default MissionCompleteAnimation;
