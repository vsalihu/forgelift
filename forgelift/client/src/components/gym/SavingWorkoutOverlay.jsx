import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { ErrorIcon } from "../icons/featureIcons.jsx";
import { HistoryIcon } from "../icons/navIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];

// The server does all of this in one request, in this order. The steps advance on a timer while
// it works and only all tick once it has answered.
const COPY = {
  save: {
    steps: ["Saving your sets", "Checking for personal records", "Updating ranks and recovery", "Adding it to your history"],
    working: "Saving your workout",
    done: "Saved to your history",
    failed: "Not saved yet",
    reassure: "Your workout is still on this device, nothing is lost. Trying again is safe: it is only ever saved once.",
    back: "Back to workout",
    Icon: HistoryIcon
  },
  edit: {
    steps: ["Saving your sets", "Checking for personal records", "Updating ranks and recovery", "Updating your history"],
    working: "Saving your changes",
    done: "Changes saved",
    failed: "Not saved yet",
    reassure: "Your changes are still on this screen, nothing is lost. Trying again is safe.",
    back: "Back to editing",
    Icon: HistoryIcon
  },
  delete: {
    steps: ["Removing the workout", "Removing its personal records", "Updating ranks and recovery", "Updating your history"],
    working: "Deleting workout",
    done: "Workout deleted",
    failed: "Not deleted yet",
    reassure: "The workout is still in your history. Trying again is safe: if it was already removed, that counts as done.",
    back: "Keep it",
    Icon: Trash2
  }
};
const STEP_AT = [0, 1400, 3000, 4800];
const SLOW_AFTER = 8000;
const VERY_SLOW_AFTER = 30000;

const useElapsed = (running) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const started = Date.now();
    setElapsed(0);
    const interval = window.setInterval(() => setElapsed(Date.now() - started), 250);
    return () => window.clearInterval(interval);
  }, [running]);
  return elapsed;
};

const Ring = ({ status, reduce, Icon }) => {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const tone = status === "error" ? "#f87171" : "#f97316";
  return (
    <div className="relative mx-auto h-28 w-28">
      <div aria-hidden="true" className={`absolute inset-3 rounded-full blur-2xl ${status === "error" ? "bg-red-500/15" : "bg-forge-ember/25"}`} />
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        {status === "saving" ? (
          <circle
            className={reduce ? "" : "origin-center animate-spin [animation-duration:1.4s]"}
            cx="50"
            cy="50"
            fill="none"
            r={r}
            stroke={tone}
            strokeDasharray={`${circumference * 0.28} ${circumference}`}
            strokeLinecap="round"
            strokeWidth="5"
          />
        ) : (
          <motion.circle
            animate={{ strokeDashoffset: 0 }}
            cx="50"
            cy="50"
            fill="none"
            initial={reduce ? false : { strokeDashoffset: circumference * 0.72 }}
            r={r}
            stroke={tone}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth="5"
            transition={{ duration: 0.5, ease: EASE }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            key={status}
            transition={{ duration: 0.2 }}
          >
            {status === "error" ? (
              <ErrorIcon className="h-10 w-10 text-red-300" />
            ) : status === "done" ? (
              <Check className="h-11 w-11 text-orange-300" strokeWidth={2.5} />
            ) : (
              <Icon className="h-10 w-10 text-orange-200" />
            )}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

const StepMark = ({ state, reduce }) => {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-6 w-6 items-center justify-center">
        <span
          className={`h-4 w-4 rounded-full border-2 border-forge-ember/30 border-t-forge-ember ${reduce ? "" : "animate-spin"}`}
        />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
    </span>
  );
};

// Full-screen state while a workout is saved or deleted: progress, a heads-up when the server is
// slow to wake, and a safe retry when it fails. status: "saving" | "done" | "error"; mode: "save" | "edit" | "delete".
const SavingWorkoutOverlay = ({ status, error, title, summary, mode = "save", onRetry, onBack }) => {
  const copy = COPY[mode] || COPY.save;
  const reduce = useReducedMotion();
  const elapsed = useElapsed(status === "saving");
  const headingRef = useRef(null);
  const retryRef = useRef(null);
  useBodyScrollLock(true);

  useEffect(() => {
    if (status === "error") retryRef.current?.focus();
    else headingRef.current?.focus();
  }, [status]);

  const steps = copy.steps.map((label, index) => ({ label, at: STEP_AT[index] }));
  const activeIndex = steps.reduce((last, step, index) => (elapsed >= step.at ? index : last), 0);
  const stepState = (index) => {
    if (status === "done") return "done";
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "pending";
  };

  const heading = status === "error" ? copy.failed : status === "done" ? copy.done : copy.working;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-busy={status === "saving"}
      aria-labelledby="saving-workout-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto overscroll-contain bg-[#07080a]/95 px-4 py-8 backdrop-blur-md"
      initial={reduce ? false : { opacity: 0 }}
      role="dialog"
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Ring Icon={copy.Icon} reduce={reduce} status={status} />

        <h2 className="font-display mt-6 text-2xl text-white outline-none" id="saving-workout-title" ref={headingRef} tabIndex={-1}>
          {heading}
        </h2>
        {title ? (
          <p className="mt-1 truncate text-sm text-zinc-400">
            {title}
            {summary ? <span className="text-zinc-500"> · {summary}</span> : null}
          </p>
        ) : null}

        {status === "error" ? (
          <div className="mt-6 text-left">
            <p className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error || "Something went wrong."}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {copy.reassure}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                type="button"
                onClick={onBack}
              >
                {copy.back}
              </button>
              <button
                className="min-h-12 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-4 text-sm font-black text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                ref={retryRef}
                type="button"
                onClick={onRetry}
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <ol className="mx-auto mt-7 max-w-xs space-y-3 text-left">
              {steps.map((step, index) => {
                const state = stepState(index);
                return (
                  <li className="flex items-center gap-3" key={step.label}>
                    <StepMark reduce={reduce} state={state} />
                    <span className={`text-sm transition-colors duration-300 ${state === "pending" ? "text-zinc-600" : state === "active" ? "font-semibold text-white" : "text-zinc-300"}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p aria-live="polite" className="sr-only">
              {status === "done" ? heading : steps[activeIndex].label}
            </p>
            <AnimatePresence>
              {status === "saving" && elapsed >= SLOW_AFTER ? (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-sm leading-6 text-zinc-400"
                  exit={{ opacity: 0 }}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  role="status"
                >
                  {elapsed >= VERY_SLOW_AFTER
                    ? "Still working. Keep this screen open; your workout stays on this device until the server confirms it."
                    : "The server was asleep and is waking up. This can take up to a minute the first time."}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SavingWorkoutOverlay;
