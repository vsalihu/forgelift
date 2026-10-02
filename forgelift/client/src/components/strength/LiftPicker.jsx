import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import MuscleFilterChips from "../exercises/MuscleFilterChips.jsx";
import { titleCase } from "../exercises/exerciseMeta.js";
import SearchInput from "../ui/SearchInput.jsx";
import { filterAndRankExercises, getMuscleFilterCounts, muscleFilters } from "../../utils/exerciseMatchUtils.js";
import { getBroadMuscleImage } from "../../utils/muscleImages.js";

const POPULAR = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-Up", "Pull-up", "Hip Thrust", "Romanian Deadlift"];

// Choose the lift a baseline is for. Shows the big lifts first, search and muscle chips for the rest.
const LiftPicker = ({ exercises = [], selectedName, enteredNames = [], onSelect }) => {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const browsing = !search && muscle === "All";

  const counts = useMemo(() => getMuscleFilterCounts({ exercises, filters: { search }, filterList: muscleFilters }), [exercises, search]);
  const results = useMemo(() => {
    const source = browsing ? exercises.filter((exercise) => POPULAR.some((name) => name.toLowerCase() === exercise.name?.toLowerCase())) : exercises;
    return filterAndRankExercises({ exercises: source, search, muscle }).slice(0, browsing ? 10 : 30);
  }, [exercises, search, muscle, browsing]);

  return (
    <div className="space-y-3">
      <div data-tour-id="baseline-search">
        <SearchInput placeholder="Search bench, quads, brachialis..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <MuscleFilterChips counts={counts} imageFor={getBroadMuscleImage} muscles={muscleFilters.filter((item) => item === "All" || counts[item] > 0)} value={muscle} onChange={setMuscle} />

      <div data-tour-id={browsing ? "baseline-popular-lifts" : undefined}>
        <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{browsing ? "The big lifts" : `${results.length} match${results.length === 1 ? "" : "es"}`}</p>
        {results.length ? (
          <ul aria-label="Lifts" className="grid gap-1.5 sm:grid-cols-2" role="radiogroup">
            {results.map(({ exercise }) => {
              const active = exercise.name === selectedName;
              const entered = enteredNames.includes(exercise.name);
              return (
                <li key={exercise._id || exercise.name}>
                  <button
                    aria-checked={active}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      active ? "border-forge-ember/60 bg-forge-ember/[0.1]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.06]"
                    }`}
                    role="radio"
                    type="button"
                    onClick={() => onSelect(exercise)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-white">{exercise.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {[exercise.category, exercise.equipment ? titleCase(exercise.equipment) : ""].filter(Boolean).join(" · ")}
                        {entered ? <span className="text-emerald-300"> · Entered</span> : null}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-transparent bg-forge-ember text-[#160a02]" : "border-white/20"}`}
                    >
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/12 p-5 text-center text-sm text-zinc-400">No lifts match that search.</p>
        )}
      </div>
    </div>
  );
};

export default LiftPicker;
