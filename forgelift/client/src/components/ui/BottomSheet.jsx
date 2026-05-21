import { X } from "lucide-react";

const BottomSheet = ({ open, title, children, onClose, className = "" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 h-full w-full bg-black/70" type="button" aria-label="Close" onClick={onClose} />
      <section
        className={`absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden rounded-t-2xl border border-white/10 bg-forge-panel shadow-2xl lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:w-full lg:max-w-3xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl ${className}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <h2 className="text-lg font-black text-white">{title}</h2>
          </div>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(88vh-5rem)] overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </section>
    </div>
  );
};

export default BottomSheet;
