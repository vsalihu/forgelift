import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

const confirmTone = {
  danger: "border border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25",
  primary: "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
};

const ConfirmModal = ({ title, description, confirmLabel = "Confirm", cancelLabel = "Go back", loading = false, tone = "danger", onCancel, onConfirm }) => {
  const reduce = useReducedMotion();
  const cancelRef = useRef(null);
  useBodyScrollLock(true);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button aria-label="Close" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm" tabIndex={-1} type="button" onClick={onCancel} />
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-describedby={description ? "confirm-modal-description" : undefined}
        aria-labelledby="confirm-modal-title"
        aria-modal="true"
        className="relative mb-[env(safe-area-inset-bottom)] w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#0e1014] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)]"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        role="alertdialog"
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <h2 className="font-display text-2xl text-white" id="confirm-modal-title">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-zinc-400" id="confirm-modal-description">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:min-h-11"
            ref={cancelRef}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`min-h-12 rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60 sm:min-h-11 ${confirmTone[tone] || confirmTone.danger}`}
            disabled={loading}
            type="button"
            onClick={onConfirm}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
