import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

// For destructive actions: the user types a word to unlock the button.
const ConfirmDangerModal = ({ title, description, confirmWord, onConfirm, onCancel, loading = false, detailsList = [] }) => {
  const titleId = useId();
  const inputRef = useRef(null);
  const [typed, setTyped] = useState("");
  const canConfirm = typed.trim().toUpperCase() === confirmWord;
  useBodyScrollLock(true);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onCancel?.();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div aria-labelledby={titleId} aria-modal="true" className="w-full max-w-lg rounded-[1.75rem] border border-red-400/30 bg-[#0e1014] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] sm:p-6" role="alertdialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-300">Can't be undone</p>
            <h2 className="font-display mt-1 text-2xl text-white" id={titleId}>
              {title}
            </h2>
          </div>
          <button aria-label="Cancel" className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10" type="button" onClick={onCancel}>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>

        {detailsList.length ? (
          <ul className="mt-4 space-y-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300">
            {detailsList.map((detail) => (
              <li className="flex gap-2.5" key={detail}>
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-300/70" />
                {detail}
              </li>
            ))}
          </ul>
        ) : null}

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-zinc-200">
            Type <span className="font-bold text-red-200">{confirmWord}</span> to confirm
          </span>
          <input
            autoCapitalize="characters"
            autoComplete="off"
            className="min-h-12 w-full rounded-2xl border border-red-400/30 bg-white/[0.03] px-4 text-base font-bold tracking-wider text-white outline-none focus:border-red-300"
            ref={inputRef}
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-6 text-sm font-bold text-white hover:bg-white/[0.09]" type="button" onClick={onCancel}>
            Keep my data
          </button>
          <button
            className="min-h-12 rounded-full bg-red-500 px-6 text-sm font-black text-white transition-opacity hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-35"
            disabled={!canConfirm || loading}
            type="button"
            onClick={onConfirm}
          >
            {loading ? "Working..." : title}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDangerModal;
