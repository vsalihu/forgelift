import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import { GymModeIcon, OverloadIcon } from "../icons/navIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];

const Chip = ({ children, tone = "neutral", onClick }) => (
  <button
    className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
      tone === "ember"
        ? "border-forge-ember/30 bg-forge-ember/[0.1] text-orange-100 hover:bg-forge-ember/20"
        : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/25 hover:bg-white/[0.07]"
    }`}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
);

const SectionLabel = ({ children }) => <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{children}</h2>;

const GymStart = ({ templates, inbox, recent, targets, onAdd, onLoadPicker, onTemplate, onInbox, onQuickAdd }) => {
  const reduce = useReducedMotion();
  const rise = (delay) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } };

  return (
    <div className="pb-6 pt-6 sm:pt-12">
      <motion.section className="text-center" {...rise(0)}>
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 animate-pulse rounded-full bg-forge-ember/25 blur-2xl" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-forge-ember/40 bg-gradient-to-b from-forge-ember/25 to-forge-ember/5 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <GymModeIcon className="h-10 w-10" />
          </span>
        </div>
        <h1 className="font-display mt-6 text-4xl leading-[1.02] text-white sm:text-5xl">Ready when you are.</h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-zinc-400">
          Start from a saved workout or build it as you go. Your session saves on this device until you finish.
        </p>
        <div className="mx-auto mt-7 grid max-w-sm gap-2.5">
          <button
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-base font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_18px_40px_-14px_rgba(249,115,22,0.95)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080a] active:scale-[0.98]"
            data-tour-id="gym-add-exercise"
            type="button"
            onClick={onAdd}
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Add first exercise
          </button>
          <button
            className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={onLoadPicker}
          >
            Load a saved workout
          </button>
        </div>
      </motion.section>

      {templates.length ? (
        <motion.section className="mt-12" {...rise(0.12)}>
          <SectionLabel>Your workouts</SectionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {templates.slice(0, 4).map((template) => (
              <button
                className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-[border-color,background-color] hover:border-forge-ember/40 hover:bg-forge-ember/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                key={template._id}
                type="button"
                onClick={() => onTemplate(template)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-white">{template.name}</span>
                  <span className="mt-1 block truncate text-sm text-zinc-500">
                    {template.exercises.length} exercises · {template.exercises.slice(0, 3).map((item) => item.exerciseName).join(", ")}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-300" />
              </button>
            ))}
          </div>
          {templates.length > 4 ? (
            <button className="mt-3 text-sm font-bold text-orange-300 hover:text-orange-200" type="button" onClick={onLoadPicker}>
              See all {templates.length} workouts
            </button>
          ) : null}
        </motion.section>
      ) : null}

      {inbox.length ? (
        <motion.section className="mt-10" {...rise(0.18)}>
          <SectionLabel>Sent by friends</SectionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {inbox.slice(0, 2).map((item) => (
              <button
                className="flex items-center gap-3 rounded-2xl border border-forge-ember/20 bg-forge-ember/[0.06] p-4 text-left transition-colors hover:bg-forge-ember/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                key={item._id}
                type="button"
                onClick={() => onInbox(item)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-white">{item.workoutName}</span>
                  <span className="mt-1 block truncate text-sm text-zinc-400">
                    From @{item.fromUserId?.username} · {item.exercises.length} exercises
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-300/70" />
              </button>
            ))}
          </div>
        </motion.section>
      ) : null}

      {targets.length ? (
        <motion.section className="mt-10" {...rise(0.24)}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-300/90">
            <OverloadIcon className="h-4 w-4" />
            Ready to progress
          </h2>
          <div className="flex flex-wrap gap-2">
            {targets.map((name) => (
              <Chip key={name} tone="ember" onClick={() => onQuickAdd(name)}>
                {name}
              </Chip>
            ))}
          </div>
        </motion.section>
      ) : null}

      {recent.length ? (
        <motion.section className="mt-10" {...rise(0.3)}>
          <SectionLabel>Recent exercises</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {recent.slice(0, 8).map((exercise) => (
              <Chip key={exercise.exerciseName} onClick={() => onQuickAdd(exercise.exerciseName)}>
                {exercise.exerciseName}
              </Chip>
            ))}
          </div>
        </motion.section>
      ) : null}
    </div>
  );
};

export default GymStart;
