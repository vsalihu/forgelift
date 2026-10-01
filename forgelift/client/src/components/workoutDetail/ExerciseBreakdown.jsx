import { FirstPlaceIcon } from "../icons/featureIcons.jsx";
import { DeloadIcon, OverloadIcon } from "../icons/navIcons.jsx";
import { formatNumber } from "../gym/gymUtils.js";

const MiniStat = ({ label, value }) => (
  <div className="min-w-0 rounded-xl bg-black/20 px-3 py-2">
    <dt className="truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
    <dd className="mt-0.5 truncate text-sm font-bold tabular-nums text-white">{value}</dd>
  </div>
);

const loadText = (set) => {
  if (set.bodyweightUsed) {
    return set.addedLoad > 0 ? `BW +${formatNumber(set.addedLoad)}kg` : "Bodyweight";
  }
  return `${formatNumber(set.weight)}kg`;
};

const ExerciseBreakdown = ({ exercise, index, recordCount, overload, deload }) => {
  const muscles = (exercise.primaryMuscles?.length ? exercise.primaryMuscles : exercise.mainMuscleGroups || []).slice(0, 3);
  const bestSet = (exercise.sets || []).reduce((best, set) => ((set.estimated1RM || 0) > (best?.estimated1RM || 0) ? set : best), null);

  return (
    <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-sm font-black tabular-nums text-orange-200">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display break-words text-xl leading-tight text-white">{exercise.exerciseName}</h3>
            {recordCount ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-forge-ember/15 px-2.5 py-0.5 text-xs font-bold text-orange-200">
                <FirstPlaceIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {recordCount} {recordCount === 1 ? "PR" : "PRs"}
              </span>
            ) : null}
          </div>
          {muscles.length ? <p className="mt-1 truncate text-sm text-zinc-500">{muscles.join(" · ")}</p> : null}
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Volume" value={`${formatNumber(exercise.exerciseTotalVolume, 0)}kg`} />
        <MiniStat label="Best e1RM" value={exercise.exerciseBestEstimated1RM ? `${formatNumber(exercise.exerciseBestEstimated1RM)}kg` : "–"} />
        <MiniStat label="Avg RPE" value={exercise.exerciseAverageRPE ? formatNumber(exercise.exerciseAverageRPE) : "–"} />
      </dl>

      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">Sets for {exercise.exerciseName}</caption>
        <thead>
          <tr className="text-left text-[0.7rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
            <th className="w-10 pb-1.5 pl-2 font-bold" scope="col">Set</th>
            <th className="pb-1.5 font-bold" scope="col">Load × reps</th>
            <th className="pb-1.5 text-right font-bold" scope="col">e1RM</th>
            <th className="w-14 pb-1.5 pr-2 text-right font-bold" scope="col">RPE</th>
          </tr>
        </thead>
        <tbody>
          {(exercise.sets || []).map((set, setIndex) => {
            const failed = set.completed === false;
            const best = set === bestSet && !failed;
            return (
              <tr className={`border-t border-white/[0.05] align-top ${best ? "bg-forge-ember/[0.06]" : ""}`} key={setIndex}>
                <td className={`py-2.5 pl-2 font-black tabular-nums ${failed ? "text-red-300" : "text-zinc-400"}`}>{setIndex + 1}</td>
                <td className="py-2.5">
                  <span className="font-bold tabular-nums text-white">
                    {loadText(set)} × {set.reps}
                  </span>
                  {failed ? <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-red-200">Failed</span> : null}
                  {best ? <span className="ml-2 text-[0.7rem] font-bold uppercase tracking-wide text-orange-300">Top set</span> : null}
                  {set.notes ? <span className="mt-0.5 block text-xs text-zinc-500">{set.notes}</span> : null}
                </td>
                <td className="py-2.5 text-right tabular-nums text-zinc-300">{set.estimated1RM ? formatNumber(set.estimated1RM) : "–"}</td>
                <td className="py-2.5 pr-2 text-right tabular-nums text-zinc-300">{set.rpe || "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {overload ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-forge-ember/25 bg-forge-ember/[0.07] p-3.5">
          <OverloadIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-white">
              Next time
              {overload.recommendedWeight ? <span className="tabular-nums text-orange-200"> · {formatNumber(overload.recommendedWeight)}kg</span> : null}
              {overload.recommendedRepTarget ? <span className="tabular-nums text-orange-200"> × {overload.recommendedRepTarget}</span> : null}
            </p>
            <p className="mt-0.5 leading-6 text-zinc-400">{overload.reason}</p>
          </div>
        </div>
      ) : null}

      {deload ? (
        <div className="mt-3 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-3.5">
          <DeloadIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-white">
              Deload suggested{deload.severity ? <span className="font-semibold text-amber-200"> · {deload.severity}</span> : null}
            </p>
            <p className="mt-0.5 leading-6 text-amber-100/80">{deload.reason}</p>
            {deload.plan?.nextSessionTarget ? <p className="mt-1 text-zinc-400">{deload.plan.nextSessionTarget}</p> : null}
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default ExerciseBreakdown;
