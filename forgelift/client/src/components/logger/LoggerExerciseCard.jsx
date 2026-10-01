import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import ExerciseHints, { LoadTypeToggle } from "../gym/ExerciseHints.jsx";
import SetRow from "../gym/SetRow.jsx";
import { exerciseVolume, formatNumber, isBodyweightExercise, loggedSetCount, setPlaceholder } from "../gym/gymUtils.js";

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:pointer-events-none disabled:opacity-30";

const LoggerExerciseCard = ({
  exercise,
  index,
  total,
  history,
  suggestion,
  bodyweight,
  invalidSets,
  openSet,
  tourSetEntry,
  onToggleOpen,
  onSetChange,
  onSetPatch,
  onAddSet,
  onRemoveSet,
  onUseSuggestion,
  onBodyweightMode,
  onRemove,
  onMove
}) => {
  const reduce = useReducedMotion();
  const isBodyweight = isBodyweightExercise(exercise);
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const weighted = isBodyweight && lastSet?.bodyweightOnly === false;
  const logged = loggedSetCount(exercise);
  const muscles = (exercise.primaryMuscles?.length ? exercise.primaryMuscles : exercise.mainMuscleGroups || []).slice(0, 3);
  const hasInvalid = invalidSets.size > 0;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 transition-colors sm:p-5 ${hasInvalid ? "border-red-400/40" : "border-white/[0.08]"}`}
      id={`logger-exercise-${index}`}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      layout={reduce ? false : "position"}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-sm font-black tabular-nums text-orange-200">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display break-words text-xl leading-tight text-white sm:text-2xl">{exercise.exerciseName}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm font-semibold tabular-nums text-zinc-400">
              {logged} {logged === 1 ? "set" : "sets"} · {formatNumber(exerciseVolume(exercise), 0)}kg
            </span>
            {muscles.map((muscle) => (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-zinc-300" key={muscle}>
                {muscle}
              </span>
            ))}
          </div>
        </div>
        <div className="-mr-1.5 -mt-1 flex shrink-0">
          <button aria-label={`Move ${exercise.exerciseName} up`} className={`${iconButton} hidden sm:flex`} disabled={index === 0} type="button" onClick={() => onMove(-1)}>
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <button aria-label={`Move ${exercise.exerciseName} down`} className={`${iconButton} hidden sm:flex`} disabled={index >= total - 1} type="button" onClick={() => onMove(1)}>
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
          <button aria-label={`Remove ${exercise.exerciseName}`} className={`${iconButton} hover:bg-red-500/10 hover:text-red-300`} type="button" onClick={onRemove}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ExerciseHints className="mt-4" history={history} suggestion={suggestion} useLabel="on these sets" onUse={onUseSuggestion} />
      {isBodyweight ? <LoadTypeToggle bodyweight={bodyweight} className="mt-3" weighted={weighted} onChange={onBodyweightMode} /> : null}

      <div className="mt-4" data-tour-id={tourSetEntry ? "logger-set-entry" : undefined}>
        <div aria-hidden="true" className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 px-1.5 pb-1 text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-zinc-500">
          <span>Set</span>
          <span>{isBodyweight ? (weighted ? "+kg" : "Load") : "kg"}</span>
          <span>Reps</span>
          <span />
        </div>
        <ol className="space-y-1">
          {exercise.sets.map((set, setIndex) => (
            <SetRow
              bodyweight={bodyweight}
              detailExtra={
                <div className="flex flex-col gap-2 px-1.5 pb-2.5 sm:flex-row sm:items-center">
                  <button
                    aria-pressed={set.completed === false}
                    className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      set.completed === false ? "border-red-400/40 bg-red-500/15 text-red-100" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25"
                    }`}
                    title="Mark a set failed if you missed the rep target or stopped early."
                    type="button"
                    onClick={() => onSetPatch(setIndex, { completed: set.completed === false })}
                  >
                    {set.completed === false ? "Failed set" : "Mark as failed"}
                  </button>
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Set {setIndex + 1} note</span>
                    <input
                      className="min-h-10 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
                      placeholder="Note for this set"
                      value={set.notes || ""}
                      onChange={(event) => onSetChange(setIndex, "notes", event.target.value)}
                    />
                  </label>
                </div>
              }
              detailLabel="Effort, failed set and notes"
              index={setIndex}
              invalid={invalidSets.has(setIndex)}
              isBodyweight={isBodyweight}
              key={setIndex}
              placeholder={setPlaceholder(exercise, setIndex, history)}
              rpeOpen={openSet === setIndex}
              set={set}
              trailing={
                <button
                  aria-label={`Remove set ${setIndex + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-0"
                  disabled={exercise.sets.length === 1}
                  type="button"
                  onClick={() => onRemoveSet(setIndex)}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              }
              onChange={(field, value) => onSetChange(setIndex, field, value)}
              onRpe={(value) => onSetChange(setIndex, "rpe", value)}
              onToggleRpe={() => onToggleOpen(setIndex)}
            />
          ))}
        </ol>
        {hasInvalid ? (
          <p className="mt-2 px-1.5 text-sm text-red-300">
            {isBodyweight && !bodyweight ? "Add your bodyweight in your profile to log this exercise." : "Fill in weight and reps for the highlighted sets, or remove them."}
          </p>
        ) : null}
        <button
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-bold text-zinc-200 transition-colors hover:border-forge-ember/50 hover:bg-forge-ember/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          type="button"
          onClick={onAddSet}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add set
        </button>
      </div>
    </motion.article>
  );
};

export default LoggerExerciseCard;
