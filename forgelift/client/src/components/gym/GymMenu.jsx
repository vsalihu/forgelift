import { useEffect, useRef, useState } from "react";
import { HelpIcon, ResetIcon } from "../icons/featureIcons.jsx";
import { DesignWorkoutIcon, MoreIcon, ReportsIcon } from "../icons/navIcons.jsx";

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

const GymMenu = ({ onLoad, onNotes, onTour, onReset }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && ref.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const run = (action) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Workout options"
        className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        data-tour-id="gym-reset-workout"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0e1014]/95 p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          role="menu"
        >
          <button className={`${itemClass} text-zinc-200 hover:bg-white/[0.06] hover:text-white`} role="menuitem" type="button" onClick={run(onLoad)}>
            <DesignWorkoutIcon className="h-4 w-4 text-zinc-400" />
            Load a saved workout
          </button>
          <button className={`${itemClass} text-zinc-200 hover:bg-white/[0.06] hover:text-white`} role="menuitem" type="button" onClick={run(onNotes)}>
            <ReportsIcon className="h-4 w-4 text-zinc-400" />
            Workout notes
          </button>
          <button className={`${itemClass} text-zinc-200 hover:bg-white/[0.06] hover:text-white`} role="menuitem" type="button" onClick={run(onTour)}>
            <HelpIcon className="h-4 w-4 text-zinc-400" />
            Quick tour
          </button>
          <div className="my-1 h-px bg-white/[0.06]" />
          <button className={`${itemClass} text-red-200 hover:bg-red-500/10`} role="menuitem" type="button" onClick={run(onReset)}>
            <ResetIcon className="h-4 w-4" />
            Reset workout
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default GymMenu;
