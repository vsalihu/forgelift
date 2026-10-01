import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";

const ExerciseStrip = ({ exercises, activeIndex, onSelect, onAdd }) => {
  const reduce = useReducedMotion();
  const itemRefs = useRef([]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [activeIndex, reduce]);

  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6" data-tour-id="gym-exercise-list">
      <ol className="flex w-max gap-2 py-1">
        {exercises.map((exercise, index) => {
          const active = index === activeIndex;
          const total = exercise.sets.length || 1;
          const done = exercise.sets.filter((set) => set.done).length;
          const complete = done > 0 && done === exercise.sets.length;
          return (
            <li key={`${exercise.exerciseName}-${index}`} ref={(node) => (itemRefs.current[index] = node)}>
              <button
                aria-current={active ? "step" : undefined}
                aria-label={`${exercise.exerciseName}, ${done} of ${exercise.sets.length} sets done`}
                className={`relative flex min-h-11 max-w-[13rem] items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  active ? "border-forge-ember/50 text-white" : "border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                }`}
                type="button"
                onClick={() => onSelect(index)}
              >
                {active ? (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-forge-ember/[0.12] shadow-[0_0_24px_-8px_rgba(249,115,22,0.9)]"
                    layoutId={reduce ? undefined : "gym-strip-active"}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                ) : null}
                <span
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums ${
                    complete ? "bg-emerald-400 text-[#03140c]" : active ? "bg-forge-ember text-[#160a02]" : "bg-white/[0.07] text-zinc-300"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="relative min-w-0">
                  <span className="block truncate text-sm font-bold">{exercise.exerciseName}</span>
                  <span className="mt-1 block h-1 w-full min-w-[3rem] overflow-hidden rounded-full bg-white/[0.08]">
                    <span
                      className={`block h-full rounded-full transition-[width] duration-500 ${complete ? "bg-emerald-400" : "bg-forge-ember"}`}
                      style={{ width: `${Math.round((done / total) * 100)}%` }}
                    />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-white/15 px-4 text-sm font-bold text-zinc-300 transition-colors hover:border-forge-ember/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            data-tour-id="gym-add-exercise"
            type="button"
            onClick={onAdd}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add
          </button>
        </li>
      </ol>
    </div>
  );
};

export default ExerciseStrip;
