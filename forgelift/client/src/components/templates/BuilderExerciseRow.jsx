import { ChevronDown, ChevronUp, Minus, Plus, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cleanInteger } from "../gym/gymUtils.js";

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-25 disabled:hover:bg-transparent";
const repInput =
  "min-h-11 w-14 rounded-xl border bg-white/[0.04] text-center text-base font-bold tabular-nums text-white outline-none transition-colors focus:border-forge-ember/60";

const BuilderExerciseRow = ({ item, index, count, muscles = [], onChange, onMove, onRemove }) => {
  const reduce = useReducedMotion();
  const sets = Number(item.targetSets) || 1;
  const badRange = item.targetRepMin !== "" && item.targetRepMax !== "" && Number(item.targetRepMin) > Number(item.targetRepMax);

  return (
    <motion.li
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      layout={reduce ? false : "position"}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-3">
        <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-sm text-orange-300">{index + 1}</span>
        <div className="min-w-0 flex-1 pt-1">
          <p className="font-bold leading-snug text-white [overflow-wrap:anywhere]">{item.exerciseName}</p>
          {muscles.length ? <p className="mt-0.5 truncate text-xs text-zinc-500">{muscles.join(" · ")}</p> : null}
        </div>
        <div className="-mr-1 flex shrink-0 items-center">
          <button aria-label={`Move ${item.exerciseName} up`} className={iconButton} disabled={index === 0} type="button" onClick={() => onMove(index, -1)}>
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <button aria-label={`Move ${item.exerciseName} down`} className={iconButton} disabled={index === count - 1} type="button" onClick={() => onMove(index, 1)}>
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
          <button aria-label={`Remove ${item.exerciseName}`} className={`${iconButton} hover:text-red-200`} type="button" onClick={() => onRemove(index)}>
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 pl-12">
        <div>
          <p className="mb-1 text-xs font-semibold text-zinc-500" id={`sets-${index}`}>
            Sets
          </p>
          <div aria-labelledby={`sets-${index}`} className="flex items-center rounded-full border border-white/10 bg-white/[0.03]" role="group">
            <button aria-label="One set fewer" className={iconButton} disabled={sets <= 1} type="button" onClick={() => onChange(index, "targetSets", sets - 1)}>
              <Minus aria-hidden="true" className="h-4 w-4" />
            </button>
            <span aria-live="polite" className="w-7 text-center text-base font-bold tabular-nums text-white">
              {sets}
            </span>
            <button aria-label="One set more" className={iconButton} disabled={sets >= 10} type="button" onClick={() => onChange(index, "targetSets", sets + 1)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-zinc-500" id={`reps-${index}`}>
            Reps
          </p>
          <div aria-labelledby={`reps-${index}`} className="flex items-center gap-2" role="group">
            <input
              aria-invalid={badRange || undefined}
              aria-label={`${item.exerciseName} lowest reps`}
              className={`${repInput} ${badRange ? "border-red-400/60" : "border-white/10"}`}
              inputMode="numeric"
              value={item.targetRepMin}
              onChange={(event) => onChange(index, "targetRepMin", cleanInteger(event.target.value))}
            />
            <span className="text-sm text-zinc-500">to</span>
            <input
              aria-invalid={badRange || undefined}
              aria-label={`${item.exerciseName} highest reps`}
              className={`${repInput} ${badRange ? "border-red-400/60" : "border-white/10"}`}
              inputMode="numeric"
              value={item.targetRepMax}
              onChange={(event) => onChange(index, "targetRepMax", cleanInteger(event.target.value))}
            />
          </div>
        </div>
      </div>
      {badRange ? <p className="mt-2 pl-12 text-xs text-red-300">The range starts higher than it ends.</p> : null}
    </motion.li>
  );
};

export default BuilderExerciseRow;
