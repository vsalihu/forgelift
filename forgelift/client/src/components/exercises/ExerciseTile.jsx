import { Plus } from "lucide-react";
import MuscleImpactBars from "./MuscleImpactBars.jsx";
import { exerciseMeta } from "./exerciseMeta.js";

const matchLabel = (match) => {
  if (!match?.matchType) return "";
  const share = match.matchPercentage ? ` ${match.matchPercentage}%` : "";
  return `${match.matchType} · ${match.matchMuscle}${share}`;
};

// Exercise card used by the library (opens details) and the picker (adds the exercise).
const ExerciseTile = ({ exercise, match, onClick, adding = false, tourId }) => (
  <button
    aria-label={adding ? `Add ${exercise.name}` : `${exercise.name} details`}
    className="group flex h-full w-full flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-forge-ember/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:hover:translate-y-0"
    data-tour-id={tourId}
    type="button"
    onClick={() => onClick(exercise)}
  >
    <span className="flex w-full items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-orange-300">
          {exercise.category || "Exercise"}
          {exercise.isCustom ? <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[0.7rem] font-bold text-sky-200">Yours</span> : null}
        </span>
        <span className="font-display mt-1 block text-lg leading-snug text-white">{exercise.name}</span>
        {exerciseMeta(exercise) ? <span className="mt-0.5 block text-xs text-zinc-500">{exerciseMeta(exercise)}</span> : null}
      </span>
      {adding ? (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-orange-300 transition-colors group-hover:bg-forge-ember group-hover:text-[#160a02]">
          <Plus className="h-4 w-4" />
        </span>
      ) : null}
    </span>
    {matchLabel(match) ? (
      <span className="mt-3 inline-flex rounded-full border border-forge-ember/25 bg-forge-ember/10 px-2.5 py-1 text-xs font-bold text-orange-200">{matchLabel(match)}</span>
    ) : null}
    <span className="mt-4 block w-full">
      <MuscleImpactBars compact inline exercise={exercise} legend={false} limit={3} />
    </span>
  </button>
);

export default ExerciseTile;
