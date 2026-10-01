import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { HistoryIcon, OverloadIcon } from "../icons/navIcons.jsx";
import SetRow from "./SetRow.jsx";
import { exerciseVolume, formatNumber, isBodyweightExercise, loggedSetCount, setPlaceholder } from "./gymUtils.js";

const FocusExercise = ({
  exercise,
  index,
  total,
  history,
  suggestion,
  bodyweight,
  invalidSet,
  rpeSet,
  onSetChange,
  onToggleDone,
  onToggleRpe,
  onRpe,
  onAddSet,
  onRemoveLastSet,
  onUseSuggestion,
  onBodyweightMode,
  onRemoveExercise,
  onPrev,
  onNext
}) => {
  const isBodyweight = isBodyweightExercise(exercise);
  const modeSet = exercise.sets.find((set) => !set.done) || exercise.sets[exercise.sets.length - 1];
  const weighted = isBodyweight && modeSet?.bodyweightOnly === false;
  const logged = loggedSetCount(exercise);
  const allDone = exercise.sets.length > 0 && exercise.sets.every((set) => set.done);
  const isLast = index >= total - 1;
  const muscles = (exercise.primaryMuscles?.length ? exercise.primaryMuscles : exercise.mainMuscleGroups || []).slice(0, 3);

  return (
    <article
      className="relative overflow-clip rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:p-6"
      data-tour-id="gym-active-exercise"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-forge-ember/[0.12] blur-3xl" />

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300/90">
            Exercise {index + 1} of {total}
          </p>
          <h1 className="font-display mt-2 break-words text-[1.85rem] leading-[1.05] text-white sm:text-4xl">{exercise.exerciseName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm font-semibold tabular-nums text-zinc-400">
              {logged} {logged === 1 ? "set" : "sets"} · {formatNumber(exerciseVolume(exercise), 0)}kg
            </span>
              {muscles.map((muscle) => (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-zinc-300" key={muscle}>
                  {muscle}
                </span>
              ))}
          </div>
        </div>
        <button
          aria-label={`Remove ${exercise.exerciseName} from this workout`}
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          type="button"
          onClick={onRemoveExercise}
        >
          <Trash2 aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />
        </button>
      </header>

      {history?.lastReps || suggestion ? (
        <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
          {history?.lastReps ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 px-3.5 py-3">
              <HistoryIcon className="h-5 w-5 shrink-0 text-zinc-500" />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-zinc-500">Last time</p>
                <p className="truncate text-sm font-bold tabular-nums text-zinc-100">
                  {history.lastWeight ? `${formatNumber(history.lastWeight)}kg` : "Bodyweight"} × {history.lastReps}
                </p>
              </div>
            </div>
          ) : null}
          {suggestion ? (
            <div className="flex items-center gap-3 rounded-2xl border border-forge-ember/25 bg-forge-ember/[0.08] px-3.5 py-3">
              <OverloadIcon className="h-5 w-5 shrink-0 text-orange-300" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-orange-300/90">{suggestion.source}</p>
                <p className="truncate text-sm font-bold tabular-nums text-white">
                  {formatNumber(suggestion.weight)}kg{suggestion.repLabel ? ` × ${suggestion.repLabel}` : ""}
                </p>
              </div>
              <button
                className="min-h-9 shrink-0 rounded-full bg-forge-ember/20 px-3.5 text-sm font-bold text-orange-100 transition-colors hover:bg-forge-ember/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                aria-label={`Use ${formatNumber(suggestion.weight)}kg${suggestion.repLabel ? ` for ${suggestion.repLabel}` : ""} on the sets you haven't ticked`}
                title={suggestion.reason}
                type="button"
                onClick={onUseSuggestion}
              >
                Use
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isBodyweight ? (
        <div className="relative mt-4">
          {bodyweight ? (
            <div aria-label="Load type" className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
              {[
                { value: false, label: "Bodyweight" },
                { value: true, label: "Add weight" }
              ].map((option) => (
                <button
                  aria-checked={weighted === option.value}
                  className={`min-h-10 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    weighted === option.value ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  key={option.label}
                  role="radio"
                  type="button"
                  onClick={() => onBodyweightMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100">
              Add your bodyweight to log bodyweight sets.{" "}
              <Link className="font-bold underline underline-offset-2" to="/profile">
                Open profile
              </Link>
            </p>
          )}
        </div>
      ) : null}

      <div className="relative mt-5">
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
              index={setIndex}
              invalid={invalidSet === setIndex}
              isBodyweight={isBodyweight}
              key={setIndex}
              placeholder={setPlaceholder(exercise, setIndex, history)}
              rpeOpen={rpeSet === setIndex}
              set={set}
              onChange={(field, value) => onSetChange(setIndex, field, value)}
              onRpe={(value) => onRpe(setIndex, value)}
              onToggleDone={() => onToggleDone(setIndex)}
              onToggleRpe={() => onToggleRpe(setIndex)}
            />
          ))}
        </ol>
        {invalidSet !== null && invalidSet !== undefined ? (
          <p className="mt-2 px-1.5 text-sm text-red-300" role="alert">
            {isBodyweight && !bodyweight ? "Add your bodyweight in your profile first." : "Enter the weight and reps you lifted, then tick the set."}
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-bold text-zinc-200 transition-colors hover:border-forge-ember/50 hover:bg-forge-ember/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            data-tour-id="gym-add-set"
            type="button"
            onClick={onAddSet}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add set
          </button>
          {exercise.sets.length > 1 ? (
            <button
              aria-label="Remove the last set"
              className="flex min-h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-zinc-500 transition-colors hover:border-red-400/30 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={onRemoveLastSet}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav aria-label="Exercises" className="relative mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-white/[0.06] pt-4">
        <button
          aria-label="Previous exercise"
          className="flex min-h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-200 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-30"
          disabled={index === 0}
          type="button"
          onClick={onPrev}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-[background-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] ${
            allDone
              ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_34px_-12px_rgba(249,115,22,0.95)]"
              : "border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.09]"
          }`}
          data-tour-id="gym-next-exercise"
          type="button"
          onClick={onNext}
        >
          {isLast ? "Add next exercise" : "Next exercise"}
          {isLast ? <Plus aria-hidden="true" className="h-4 w-4" /> : <ChevronRight aria-hidden="true" className="h-4 w-4" />}
        </button>
      </nav>
    </article>
  );
};

export default FocusExercise;
