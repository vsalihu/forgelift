import { Pencil, Trash2 } from "lucide-react";
import BottomSheet from "../ui/BottomSheet.jsx";
import MuscleImpactBars from "./MuscleImpactBars.jsx";
import { titleCase } from "./exerciseMeta.js";

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
    <dt className="text-xs text-zinc-500">{label}</dt>
    <dd className="mt-0.5 truncate text-sm font-bold text-white">{value}</dd>
  </div>
);

const ExerciseDetailSheet = ({ exercise, onClose, onEdit, onDelete }) => {
  if (!exercise) return null;
  const stats = [
    ["Type", exercise.exerciseType ? titleCase(exercise.exerciseType) : ""],
    ["Equipment", exercise.equipment ? titleCase(exercise.equipment) : ""],
    ["Level", exercise.difficulty || ""],
    ["Rep range", exercise.defaultRepMin && exercise.defaultRepMax ? `${exercise.defaultRepMin}-${exercise.defaultRepMax}` : ""],
    ["Add per step", exercise.overloadIncrementKg ? `${exercise.overloadIncrementKg} kg` : ""],
    ["Movement", exercise.movementPattern ? titleCase(exercise.movementPattern) : ""]
  ].filter(([, value]) => value);

  return (
    <BottomSheet open title={exercise.name} onClose={onClose}>
      <div className="space-y-6">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-orange-300">
          {exercise.category}
          {exercise.isCustom ? <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-xs font-bold text-sky-200">Your exercise</span> : null}
        </p>

        {stats.length ? (
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <Stat key={label} label={label} value={value} />
            ))}
          </dl>
        ) : null}

        <section>
          <h3 className="font-display mb-1 text-lg text-white">What it trains</h3>
          <p className="mb-4 text-sm text-zinc-400">How much of each set counts for each muscle.</p>
          <MuscleImpactBars exercise={exercise} />
        </section>

        {exercise.instructions ? (
          <section>
            <h3 className="font-display mb-1 text-lg text-white">Notes</h3>
            <p className="whitespace-pre-line text-sm leading-6 text-zinc-300">{exercise.instructions}</p>
          </section>
        ) : null}

        {exercise.isCustom ? (
          <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={() => onEdit(exercise)}
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
              Edit
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={() => onDelete(exercise._id)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
};

export default ExerciseDetailSheet;
