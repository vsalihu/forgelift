import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "../icons/featureIcons.jsx";
import { formatClock } from "./gymUtils.js";

export const REST_PRESETS = [60, 90, 120, 180];

export const restRemaining = (rest, now = Date.now()) => {
  if (!rest) return 0;
  if (rest.paused) return rest.remaining;
  return Math.max(0, (rest.endsAt - now) / 1000);
};

const presetLabel = (seconds) => (seconds < 120 ? `${seconds}s` : formatClock(seconds));

const iconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-bold tabular-nums text-zinc-100 transition-colors hover:border-white/25 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-95";

const Ring = ({ progress, done, size = 60, children }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg aria-hidden="true" className="-rotate-90" height={size} width={size}>
        <circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={done ? "#34d399" : "url(#rest-ember)"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          strokeWidth={stroke}
          style={{ transition: "stroke-dashoffset 250ms linear" }}
        />
        <defs>
          <linearGradient id="rest-ember" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

const RestDock = ({ rest, defaultSeconds, nextLabel, onPreset, onStart, onAdjust, onTogglePause, onSkip }) => {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(Date.now());
  const firedRef = useRef(null);

  useEffect(() => {
    if (!rest || rest.paused) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [rest]);

  const remaining = restRemaining(rest, now);
  const done = Boolean(rest) && !rest.paused && remaining <= 0;
  const progress = rest?.duration ? Math.min(1, Math.max(0, 1 - remaining / rest.duration)) : 0;

  useEffect(() => {
    if (!done || firedRef.current === rest?.endsAt) return;
    firedRef.current = rest?.endsAt;
    try {
      navigator.vibrate?.([180, 90, 180]);
    } catch (_error) {
      // Vibration is optional.
    }
  }, [done, rest?.endsAt]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
      <motion.section
        aria-label="Rest timer"
        className={`pointer-events-auto mx-auto max-w-2xl rounded-[1.75rem] border p-2.5 backdrop-blur-xl transition-[border-color,box-shadow] duration-500 ${
          done
            ? "border-emerald-400/40 bg-[#07130f]/90 shadow-[0_0_60px_-12px_rgba(52,211,153,0.55)]"
            : rest
              ? "border-forge-ember/30 bg-[#120c08]/90 shadow-[0_24px_60px_-20px_rgba(249,115,22,0.45)]"
              : "border-white/10 bg-[#0d0f13]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
        }`}
        data-tour-id="gym-rest-timer"
        layout={!reduce}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
      >
        <p aria-live="polite" className="sr-only">
          {done ? "Rest over. Time for your next set." : ""}
        </p>
        <AnimatePresence initial={false} mode="popLayout">
          {rest ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5"
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              key="running"
            >
              <Ring done={done} progress={done ? 1 : progress}>
                <span className={`text-[0.95rem] font-black tabular-nums ${done ? "text-emerald-300" : "text-white"}`}>
                  {done ? "Go" : formatClock(Math.ceil(remaining))}
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className={`text-[0.7rem] font-bold uppercase tracking-[0.16em] ${done ? "text-emerald-300" : "text-orange-300"}`}>
                  {done ? "Rest over" : rest.paused ? "Paused" : "Resting"}
                </p>
                <p className="truncate text-sm font-semibold text-zinc-200">{nextLabel || "Next set"}</p>
              </div>
              {done ? (
                <button className={`${iconButton} w-auto px-4`} type="button" onClick={onSkip}>
                  Dismiss
                </button>
              ) : (
                <>
                  <button aria-label="Remove 15 seconds" className={`${iconButton} hidden min-[400px]:flex`} type="button" onClick={() => onAdjust(-15)}>
                    −15
                  </button>
                  <button aria-label="Add 15 seconds" className={iconButton} type="button" onClick={() => onAdjust(15)}>
                    +15
                  </button>
                  <button aria-label={rest.paused ? "Resume rest timer" : "Pause rest timer"} className={iconButton} type="button" onClick={onTogglePause}>
                    {rest.paused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                  </button>
                  <button aria-label="Skip rest" className={iconButton} type="button" onClick={onSkip}>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              key="idle"
            >
              <span className="hidden pl-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 min-[400px]:block">Rest</span>
              <div aria-label="Rest length" className="flex min-w-0 flex-1 gap-1 rounded-full bg-white/[0.04] p-1" role="radiogroup">
                {REST_PRESETS.map((seconds) => {
                  const selected = seconds === defaultSeconds;
                  return (
                    <button
                      aria-checked={selected}
                      className={`min-h-9 min-w-0 flex-1 rounded-full text-sm font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                        selected ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
                      }`}
                      key={seconds}
                      role="radio"
                      type="button"
                      onClick={() => onPreset(seconds)}
                    >
                      {presetLabel(seconds)}
                    </button>
                  );
                })}
              </div>
              <button
                aria-label={`Start ${presetLabel(defaultSeconds)} rest`}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-95"
                type="button"
                onClick={onStart}
              >
                <PlayIcon className="h-4 w-4" />
                Rest
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default RestDock;
