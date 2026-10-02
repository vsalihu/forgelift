import { Check, Plus } from "lucide-react";
import BottomSheet from "../../ui/BottomSheet.jsx";
import CoverageMeter, { STATUS_TEXT } from "./CoverageMeter.jsx";
import { titleCase } from "../../exercises/exerciseMeta.js";
import { PARTS_BY_ID, exercisesForPart, fillStatus } from "../../../utils/muscleMap.js";

const pct = (value) => `${Math.round(value * 100)}%`;

// Everything that trains one muscle part, best first, with one-tap add.
const PartSheet = ({ partId, coverage, library, experience, inWorkout, onAdd, onClose }) => {
  const part = partId ? PARTS_BY_ID[partId] : null;
  if (!part) return null;
  const current = coverage.groups.flatMap((group) => group.parts).find((item) => item.id === partId);
  const fill = current?.fill ?? coverage.allFills[partId] ?? 0;
  const status = current?.status || fillStatus(fill);
  const options = exercisesForPart(partId, library, { experience, coverage, inWorkout }).slice(0, 14);

  return (
    <BottomSheet open title={`${part.groupLabel}: ${part.label}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className={`text-sm font-bold ${STATUS_TEXT[status.key]}`}>{status.label}</span>
            <span className="font-display text-2xl tabular-nums text-white">{pct(fill)}</span>
          </div>
          <CoverageMeter fill={fill} size="lg" status={status.key} />
          {current?.contributors?.length ? (
            <p className="mt-3 text-sm text-zinc-400">
              From {current.contributors.map((item) => item.name).join(", ")}.
              {current.capped ? " One exercise can only fill 60%, so add a different one to finish it." : ""}
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">Nothing in this workout trains it yet.</p>
          )}
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-zinc-200">Exercises that train it</h3>
          <p className="mb-3 text-xs text-zinc-500">Best first. The number is how much 3 sets would fill it.</p>
          {options.length ? (
            <ul className="space-y-1.5">
              {options.map(({ exercise, fill: gain, added }) => (
                <li className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 pl-3.5" key={exercise._id || exercise.name}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-white">{exercise.name}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="w-20 shrink-0">
                        <CoverageMeter fill={gain} status={gain >= 0.55 ? "hit" : "almost"} />
                      </span>
                      <span className="text-xs font-bold tabular-nums text-orange-200">+{pct(gain)}</span>
                      <span className="truncate text-xs text-zinc-500">
                        {[exercise.equipment ? titleCase(exercise.equipment) : "", exercise.exerciseType ? titleCase(exercise.exerciseType) : ""].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </span>
                  {added ? (
                    <span className="inline-flex min-h-10 shrink-0 items-center gap-1 px-2 text-xs font-bold text-emerald-300">
                      <Check aria-hidden="true" className="h-4 w-4" />
                      Added
                    </span>
                  ) : (
                    <button
                      aria-label={`Add ${exercise.name}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                      type="button"
                      onClick={() => onAdd(exercise)}
                    >
                      <Plus aria-hidden="true" className="h-5 w-5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/12 p-5 text-center text-sm text-zinc-400">No exercise in the library trains this part directly yet.</p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default PartSheet;
