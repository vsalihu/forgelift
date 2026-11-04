import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { FlameIcon } from "../icons/featureIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];

const formatDate = (iso) => {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch (_error) {
    return iso;
  }
};

// Sparks drifting up out of the forge. Positions come from the index so they don't jump on re-render.
const Sparks = () => {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => {
        const seed = (index * 9301 + 49297) % 233280;
        const rand = (offset) => ((seed * (offset + 1)) % 1000) / 1000;
        return {
          left: 14 + rand(1) * 72,
          size: 2 + rand(2) * 3,
          rise: 50 + rand(3) * 70,
          drift: (rand(4) - 0.5) * 40,
          duration: 2.4 + rand(5) * 2.4,
          delay: rand(6) * 3
        };
      }),
    []
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40">
      {sparks.map((spark, index) => (
        <motion.span
          animate={{ y: [0, -spark.rise], x: [0, spark.drift], opacity: [0, 1, 0], scale: [0.6, 1, 0.4] }}
          className="absolute bottom-0 rounded-full bg-amber-200 shadow-[0_0_8px_2px_rgba(251,146,60,0.8)]"
          key={index}
          style={{ left: `${spark.left}%`, width: spark.size, height: spark.size }}
          transition={{ duration: spark.duration, delay: spark.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const Emblem = ({ reduce }) => (
  <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
    {reduce
      ? null
      : [0, 1].map((ring) => (
          <motion.span
            animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
            aria-hidden="true"
            className="absolute inset-0 rounded-[1.6rem] border border-orange-400/60"
            key={ring}
            transition={{ duration: 2.6, delay: ring * 1.3, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
    <motion.div
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      className="relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-gradient-to-b from-orange-300 via-orange-500 to-forge-ember text-[#1a0b02] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_50px_-12px_rgba(249,115,22,0.95)]"
      initial={reduce ? false : { scale: 0.4, rotate: -14, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
    >
      <FlameIcon aria-hidden="true" className="h-10 w-10" />
    </motion.div>
  </div>
);

// The "What's new" card shown once per update. Purely presentational: the gate decides when.
const WhatsNewModal = ({ release, onClose, onOpenLink }) => {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useBodyScrollLock(true);

  useEffect(() => {
    // Focus the dialog itself so screen readers start at its title and no focus ring flashes on open.
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      // Keep keyboard focus inside the dialog.
      const focusable = [...panelRef.current.querySelectorAll("button, a[href]")].filter((node) => !node.disabled);
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

  // A soft light that follows the pointer across the card (no re-renders: it writes CSS variables).
  const onPointerMove = (event) => {
    if (reduce || event.pointerType !== "mouse" || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    panelRef.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    panelRef.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  const list = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.35 } }
  };
  const item = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(4px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: EASE } }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <motion.button
        animate={{ opacity: 1 }}
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default bg-[#040506]/80 backdrop-blur-md"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        tabIndex={-1}
        transition={{ duration: 0.3 }}
        type="button"
        onClick={onClose}
      />

      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative mb-[env(safe-area-inset-bottom)] w-full max-w-lg"
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.25, ease: EASE } }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Outer glow */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-forge-ember/20 blur-3xl" />

        {/* Rotating ember light running around the border */}
        <div className="relative overflow-clip rounded-[2rem] bg-white/[0.09] p-px">
          {reduce ? null : (
            <motion.div
              animate={{ rotate: 360 }}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(251,146,60,0.95) 50deg, transparent 110deg, transparent 190deg, rgba(251,191,36,0.55) 240deg, transparent 300deg)"
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div
            aria-describedby="whats-new-intro"
            aria-labelledby="whats-new-title"
            aria-modal="true"
            className="relative flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] flex-col overflow-clip rounded-[calc(2rem-1px)] bg-[#0b0c0f] outline-none sm:max-h-[calc(100dvh-3rem)]"
            ref={panelRef}
            role="dialog"
            style={{ "--spot-x": "50%", "--spot-y": "0px" }}
            tabIndex={-1}
            onPointerMove={onPointerMove}
          >
            {/* Pointer spotlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 opacity-70"
              style={{ background: "radial-gradient(420px circle at var(--spot-x) var(--spot-y), rgba(249,115,22,0.09), transparent 60%)" }}
            />

            <button
              aria-label="Close what's new"
              className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={onClose}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="relative z-10 overflow-y-auto overscroll-contain">
              {/* Hero */}
              <header className="relative overflow-clip px-6 pb-6 pt-9 text-center sm:px-8 sm:pt-10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(249,115,22,0.32), rgba(249,115,22,0.06) 45%, transparent 70%)" }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "28px 28px"
                  }}
                />
                {reduce ? null : <Sparks />}

                <div className="relative">
                  <Emblem reduce={reduce} />
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-xs font-bold tracking-wide text-orange-200"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                  >
                    <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75 motion-reduce:hidden" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                    </span>
                    New in ForgeLift · {formatDate(release.date)}
                  </motion.p>
                  <motion.h2
                    animate={{ opacity: 1, y: 0, backgroundPosition: "0% 50%" }}
                    className="font-display mx-auto mt-4 max-w-sm bg-gradient-to-r from-white via-orange-100 to-white bg-[length:250%_100%] bg-clip-text text-[1.75rem] leading-[1.1] text-transparent sm:text-3xl"
                    id="whats-new-title"
                    initial={reduce ? false : { opacity: 0, y: 10, backgroundPosition: "100% 50%" }}
                    transition={{ duration: 1.4, delay: 0.25, ease: EASE }}
                  >
                    {release.title}
                  </motion.h2>
                  <motion.p
                    animate={{ opacity: 1 }}
                    className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400"
                    id="whats-new-intro"
                    initial={reduce ? false : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  >
                    {release.intro}
                  </motion.p>
                </div>
              </header>

              {/* Highlights */}
              <motion.ul animate="show" className="space-y-2 px-4 pb-2 sm:px-6" initial="hidden" variants={list}>
                {release.highlights.map(({ icon: Icon, title, body, to, cta }) => (
                  <motion.li
                    className="group relative flex gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 transition-colors hover:border-orange-400/20"
                    key={title}
                    variants={item}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-gradient-to-b from-orange-400/20 to-forge-ember/5 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      {Icon ? <Icon aria-hidden="true" className="h-5 w-5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold leading-snug text-white">{title}</span>
                      <span className="mt-1 block text-sm leading-6 text-zinc-400">{body}</span>
                      {to ? (
                        <button
                          className="mt-1.5 inline-flex min-h-9 items-center gap-1.5 rounded-full text-sm font-bold text-orange-300 transition-colors hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                          type="button"
                          onClick={() => onOpenLink(to)}
                        >
                          {cta || "Take a look"}
                          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ) : null}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* Footer */}
            <div className="relative z-10 border-t border-white/[0.06] bg-[#0b0c0f]/90 p-4 backdrop-blur-xl sm:px-6">
              <button
                className="relative min-h-12 w-full overflow-clip rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_40px_-12px_rgba(249,115,22,0.95)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0f] active:scale-[0.98]"
                type="button"
                onClick={onClose}
              >
                {reduce ? null : (
                  <motion.span
                    animate={{ x: ["-120%", "320%"] }}
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                    transition={{ duration: 1.3, delay: 1.2, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
                  />
                )}
                <span className="relative">Let's lift</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsNewModal;
