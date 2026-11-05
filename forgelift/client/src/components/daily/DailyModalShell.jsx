import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

const EASE = [0.16, 1, 0.3, 1];

// Bottom sheet on phones, centred card on larger screens, for the check-in and the setup.
// The footer stays pinned while the body scrolls.
const DailyModalShell = ({ labelledBy, onClose, closeLabel = "Close", header, footer, children }) => {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useBodyScrollLock(true);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll("button:not([disabled]), input, a[href]")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <motion.button
        animate={{ opacity: 1 }}
        aria-label={closeLabel}
        className="absolute inset-0 h-full w-full cursor-default bg-[#040506]/75 backdrop-blur-md"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        tabIndex={-1}
        type="button"
        onClick={onClose}
      />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby={labelledBy}
        aria-modal="true"
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-clip rounded-t-[2rem] border border-white/10 bg-[#0b0c0f] shadow-[0_-30px_80px_-30px_rgba(249,115,22,0.35)] outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]"
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, transition: { duration: 0.22, ease: EASE } }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60 }}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{ background: "radial-gradient(90% 100% at 50% 0%, rgba(249,115,22,0.22), transparent 70%)" }}
        />
        <span aria-hidden="true" className="relative mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <button
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0b0c0f]/85 text-zinc-400 backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4 sm:px-7 sm:pt-7">
          {header}
          {children}
        </div>
        {footer ? <div className="relative border-t border-white/[0.06] bg-[#0b0c0f]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-7 sm:pb-4">{footer}</div> : null}
      </motion.div>
    </div>
  );
};

export default DailyModalShell;
