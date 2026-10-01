import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cleanDecimal, cleanInteger } from "./gymUtils.js";

const RPE_OPTIONS = [6, 7, 8, 9, 10];

// New sets store addedLoad as the number 0; show that as empty so the ghost value reads.
const addedValue = (value) => (value === 0 || value === null || value === undefined ? "" : String(value));

const inputClass = (done, invalid) =>
  `h-12 w-full min-w-0 rounded-xl border text-center text-xl font-bold tabular-nums text-white outline-none transition-[background-color,border-color] duration-200 placeholder:text-zinc-600 focus:border-forge-ember/70 focus:bg-white/[0.08] ${
    invalid ? "border-red-400/60 bg-red-500/[0.06]" : done ? "border-transparent bg-transparent" : "border-white/10 bg-white/[0.05]"
  }`;

const SetRow = ({
  set,
  index,
  placeholder,
  bodyweight,
  isBodyweight,
  invalid,
  rpeOpen,
  onChange,
  onToggleDone,
  onToggleRpe,
  onRpe
}) => {
  const done = Boolean(set.done);
  const number = index + 1;
  const weighted = isBodyweight && set.bodyweightOnly === false;

  return (
    <li>
      <motion.div
        animate={{ backgroundColor: done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0)" }}
        className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-2xl px-1.5 py-1.5"
        transition={{ duration: 0.25 }}
      >
        <button
          aria-expanded={rpeOpen}
          aria-label={`Set ${number}${set.rpe ? `, effort RPE ${set.rpe}` : ""}. Rate effort`}
          className={`flex h-11 flex-col items-center justify-center rounded-xl text-sm font-black tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
            done ? "text-emerald-300 hover:bg-emerald-400/10" : "text-zinc-400 hover:bg-white/[0.06]"
          }`}
          type="button"
          onClick={onToggleRpe}
        >
          {number}
          {set.rpe ? <span className="text-[0.65rem] font-bold leading-none text-orange-300">@{set.rpe}</span> : null}
        </button>

        {isBodyweight && !weighted ? (
          <div className="flex h-12 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
            <span className="text-sm font-black text-zinc-200">BW</span>
            <span className="text-[0.7rem] tabular-nums text-zinc-500">{bodyweight ? `${bodyweight}kg` : "not set"}</span>
          </div>
        ) : (
          <div className="relative">
            {weighted ? <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base font-bold text-zinc-500">+</span> : null}
            <input
              aria-invalid={invalid || undefined}
              aria-label={weighted ? `Set ${number} added weight in kg` : `Set ${number} weight in kg`}
              autoComplete="off"
              className={inputClass(done, invalid && !(weighted ? set.addedLoad : set.weight))}
              enterKeyHint="next"
              inputMode="decimal"
              placeholder={(weighted ? placeholder.addedLoad : placeholder.weight) || "0"}
              type="text"
              value={weighted ? addedValue(set.addedLoad) : set.weight ?? ""}
              onChange={(event) => onChange(weighted ? "addedLoad" : "weight", cleanDecimal(event.target.value))}
            />
          </div>
        )}

        <input
          aria-invalid={invalid || undefined}
          aria-label={`Set ${number} reps`}
          autoComplete="off"
          className={inputClass(done, invalid && !set.reps)}
          enterKeyHint="done"
          inputMode="numeric"
          placeholder={placeholder.reps || "0"}
          type="text"
          value={set.reps ?? ""}
          onChange={(event) => onChange("reps", cleanInteger(event.target.value))}
        />

        <motion.button
          aria-label={done ? `Set ${number} done. Undo` : `Mark set ${number} done`}
          aria-pressed={done}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
            done
              ? "border-emerald-300/60 bg-emerald-400 text-[#03140c] shadow-[0_0_24px_-6px_rgba(52,211,153,0.9)]"
              : "border-white/15 bg-white/[0.04] text-zinc-500 hover:border-white/30 hover:text-zinc-200"
          }`}
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={onToggleDone}
        >
          <motion.span animate={{ scale: done ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
            <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
          </motion.span>
        </motion.button>
      </motion.div>

      <AnimatePresence initial={false}>
        {rpeOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1" role="group" aria-label={`Effort for set ${number}`}>
              <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">RPE</span>
              {RPE_OPTIONS.map((rpe) => {
                const selected = Number(set.rpe) === rpe;
                return (
                  <button
                    aria-pressed={selected}
                    className={`h-9 min-w-0 flex-1 rounded-full text-sm font-black tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      selected ? "bg-forge-ember text-[#160a02]" : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]"
                    }`}
                    key={rpe}
                    type="button"
                    onClick={() => onRpe(selected ? "" : String(rpe))}
                  >
                    {rpe}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
};

export default SetRow;
