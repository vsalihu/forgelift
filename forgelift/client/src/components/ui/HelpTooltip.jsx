import { useEffect, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

const HelpTooltip = ({ title, content, example, size = "sm" }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const iconSize = size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={wrapperRef}
    >
      <button
        aria-expanded={open}
        aria-label={`Explain ${title}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-forge-copper focus:bg-white/10 focus:text-forge-copper focus:outline-none focus:ring-2 focus:ring-forge-ember/40"
        type="button"
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
      >
        <CircleHelp className={iconSize} />
      </button>
      {open ? (
        <span className="fixed left-4 right-4 top-20 z-50 rounded-lg border border-white/10 bg-slate-950 p-4 text-left shadow-2xl shadow-black/50 sm:absolute sm:left-1/2 sm:right-auto sm:top-8 sm:w-[280px] sm:-translate-x-1/2">
          <span className="block text-sm font-bold text-white">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-slate-300">{content}</span>
          {example ? <span className="mt-3 block text-xs leading-5 text-forge-copper">{example}</span> : null}
        </span>
      ) : null}
    </span>
  );
};

export default HelpTooltip;
