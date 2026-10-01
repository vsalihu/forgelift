import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

const toneClass = {
  primary:
    "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
  secondary: "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]",
  danger: "border border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
};

// Small confirm dialog for Gym Mode. Actions: [{ label, tone, onClick }], last one is the main action.
const GymDialog = ({ title, description, actions, onClose }) => {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  useBodyScrollLock(true);

  useEffect(() => {
    panelRef.current?.querySelector("button:last-of-type")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button aria-label="Close" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm" tabIndex={-1} type="button" onClick={onClose} />
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-describedby={description ? "gym-dialog-description" : undefined}
        aria-labelledby="gym-dialog-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#0e1014] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] mb-[env(safe-area-inset-bottom)]"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        ref={panelRef}
        role="alertdialog"
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <h2 className="font-display text-2xl text-white" id="gym-dialog-title">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-400" id="gym-dialog-description">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {actions.map((action) => (
            <button
              className={`min-h-12 rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:min-h-11 ${toneClass[action.tone] || toneClass.secondary}`}
              key={action.label}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GymDialog;
