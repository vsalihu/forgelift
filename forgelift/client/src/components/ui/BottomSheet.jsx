import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

const BottomSheet = ({ open, title, children, onClose, className = "" }) => {
  useBodyScrollLock(open);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-hidden="true" className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm" tabIndex={-1} type="button" onClick={onClose} />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        role="dialog"
        className={`absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0d0f13] shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)] lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:w-full lg:max-w-3xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl ${className}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <h2 className="font-display text-xl text-white" id={titleId}>
              {title}
            </h2>
          </div>
          <button aria-label="Close" className="rounded-full p-2 text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(88vh-5rem)] overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </section>
    </div>
  );
};

export default BottomSheet;
