import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreIcon } from "../icons/navIcons.jsx";

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

// Small "more" menu. Items: { label, icon, to | onClick, tone: "danger" }.
// className may position the menu (e.g. absolute); without it the menu is relative.
const RowMenu = ({ label, items, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  // Open upwards when the menu would end up under the phone's bottom bar or off screen
  // (the last row of a short list can't scroll far enough to reveal it).
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !ref.current) return;
    const bar = document.querySelector("[data-bottom-nav]");
    const barTop = bar && bar.offsetParent !== null ? bar.getBoundingClientRect().top : window.innerHeight;
    const limit = Math.min(window.innerHeight, barTop) - 8;
    const anchor = ref.current.getBoundingClientRect();
    const height = menuRef.current.offsetHeight;
    setDropUp(anchor.bottom + 4 + height > limit && anchor.top - 4 - height > 8);
  }, [open]);

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

  return (
    <div className={`${className || "relative"} ${open ? "z-30" : ""}`} ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-30 w-52 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} rounded-2xl border border-white/10 bg-[#0e1014]/95 p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl`}
          ref={menuRef}
          role="menu"
        >
          {items.map(({ label: itemLabel, icon: Icon, to, onClick, tone }) => {
            const classes = `${itemClass} ${tone === "danger" ? "text-red-200 hover:bg-red-500/10" : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"}`;
            const content = (
              <>
                {Icon ? <Icon aria-hidden="true" className={`h-4 w-4 ${tone === "danger" ? "" : "text-zinc-400"}`} /> : null}
                {itemLabel}
              </>
            );
            return to ? (
              <Link className={classes} key={itemLabel} role="menuitem" to={to} onClick={() => setOpen(false)}>
                {content}
              </Link>
            ) : (
              <button
                className={classes}
                key={itemLabel}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onClick();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default RowMenu;
