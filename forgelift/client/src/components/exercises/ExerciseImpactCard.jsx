import { Dumbbell } from "lucide-react";

const roleStyles = {
  primary: "from-emerald-400 to-cyan-300 text-emerald-200",
  secondary: "from-amber-400 to-violet-300 text-amber-200",
  stabiliser: "from-slate-400 to-slate-300 text-slate-300"
};

const getRole = (exercise, muscle) => {
  if (exercise.primaryMuscles?.includes(muscle)) return "primary";
  if (exercise.secondaryMuscles?.includes(muscle)) return "secondary";
  if (exercise.stabiliserMuscles?.includes(muscle)) return "stabiliser";
  return "secondary";
};

const ImpactBar = ({ muscle, value, role }) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
      <span className={`font-bold ${roleStyles[role]?.split(" ").slice(-1)[0] || "text-slate-300"}`}>{muscle}</span>
      <span className="text-slate-400">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${roleStyles[role]?.split(" ").slice(0, 2).join(" ") || "from-slate-400 to-slate-300"}`}
        style={{ width: `${Math.min(Number(value) || 0, 100)}%` }}
      />
    </div>
  </div>
);

const ExerciseImpactCard = ({ exercise, match, onSelect }) => {
  const impactEntries = Object.entries(exercise.impactProfile || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
  const primaryImpact = impactEntries.filter(([muscle]) => exercise.primaryMuscles?.includes(muscle));
  const secondaryImpact = impactEntries.filter(([muscle]) => exercise.secondaryMuscles?.includes(muscle));
  const stabiliserImpact = impactEntries.filter(([muscle]) => exercise.stabiliserMuscles?.includes(muscle));
  const fallbackImpact = impactEntries.filter(
    ([muscle]) =>
      !exercise.primaryMuscles?.includes(muscle) &&
      !exercise.secondaryMuscles?.includes(muscle) &&
      !exercise.stabiliserMuscles?.includes(muscle)
  );
  const groupedImpact = [
    ["Primary", primaryImpact, "primary"],
    ["Secondary", secondaryImpact, "secondary"],
    ["Stabiliser", stabiliserImpact, "stabiliser"],
    ["Impact", fallbackImpact, "secondary"]
  ].filter(([, entries]) => entries.length);

  return (
    <button
      className="w-full rounded-xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-forge-copper/60 hover:bg-white/[0.06]"
      type="button"
      onClick={() => onSelect(exercise)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-forge-copper">{exercise.category || "Exercise"}</p>
          <h3 className="mt-1 text-lg font-black text-white">{exercise.name}</h3>
        </div>
        <span className="rounded-lg bg-white/10 p-2 text-forge-ember">
          <Dumbbell className="h-5 w-5" />
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold">
        {match?.matchType ? (
          <span className="rounded-full bg-forge-ember/15 px-2 py-1 text-orange-200">
            {match.matchType} match: {match.matchMuscle}
            {match.matchPercentage ? ` ${match.matchPercentage}%` : ""}
          </span>
        ) : null}
        <span className="rounded-full bg-white/10 px-2 py-1 text-slate-200">{exercise.exerciseType || "type n/a"}</span>
        {(exercise.mainMuscleGroups || []).slice(0, 3).map((group) => (
          <span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-200" key={group}>{group}</span>
        ))}
        {exercise.equipment ? <span className="rounded-full bg-white/10 px-2 py-1 text-slate-200">{exercise.equipment}</span> : null}
        {exercise.difficulty ? <span className="rounded-full bg-white/10 px-2 py-1 text-slate-200">{exercise.difficulty}</span> : null}
      </div>

      {exercise.detailedMuscles?.length ? (
        <div className="mb-3 flex flex-wrap gap-1">
          {exercise.detailedMuscles.slice(0, 6).map((muscle) => (
            <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300" key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      ) : null}

      {groupedImpact.length ? (
        <div className="space-y-3">
          {groupedImpact.slice(0, 3).map(([label, entries, role]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <div className="space-y-2">
                {entries.slice(0, 3).map(([muscle, value]) => (
                  <ImpactBar key={muscle} muscle={muscle} role={role || getRole(exercise, muscle)} value={value} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Impact data not available.</p>
      )}
    </button>
  );
};

export default ExerciseImpactCard;
