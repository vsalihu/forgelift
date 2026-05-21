import { useMemo, useState } from "react";
import ExerciseImpactCard from "../exercises/ExerciseImpactCard.jsx";
import FilterChipGroup from "../ui/FilterChipGroup.jsx";
import SearchInput from "../ui/SearchInput.jsx";
import { advancedMuscleFilters, filterAndRankExercises, getMuscleFilterCounts, muscleFilters } from "../../utils/exerciseMatchUtils.js";

const popularLifts = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-Up",
  "Pull-up",
  "Hip Thrust",
  "Romanian Deadlift"
];

const StrengthExerciseSelector = ({ exercises = [], selectedName, onSelect }) => {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const counts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: { search }, filterList: muscleFilters }),
    [exercises, search]
  );
  const advancedCounts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: { search }, filterList: advancedMuscleFilters }),
    [exercises, search]
  );
  const results = useMemo(() => {
    const shouldShowPopular = !search && muscle === "All";
    const source = shouldShowPopular
      ? exercises.filter((exercise) => popularLifts.some((lift) => lift.toLowerCase() === exercise.name?.toLowerCase()))
      : exercises;

    return filterAndRankExercises({ exercises: source, search, muscle }).slice(0, shouldShowPopular ? 10 : 24);
  }, [exercises, muscle, search]);
  const selectedExercise = exercises.find((exercise) => exercise.name === selectedName);

  return (
    <div className="space-y-4">
      <SearchInput label="Find exercise" placeholder="Search bench, quads, brachialis..." value={search} onChange={(event) => setSearch(event.target.value)} />
      <FilterChipGroup
        items={muscleFilters.filter((item) => item === "All" || counts[item] > 0).map((item) => ({ value: item, label: item, count: item === "All" ? null : counts[item] }))}
        value={muscle}
        onChange={setMuscle}
      />
      <button className="text-sm font-semibold text-forge-ember hover:text-orange-300" type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "Hide advanced muscles" : "Show advanced muscles"}
      </button>
      {showAdvanced ? (
        <FilterChipGroup
          items={advancedMuscleFilters.filter((item) => advancedCounts[item] > 0).map((item) => ({ value: item, label: item, count: advancedCounts[item] }))}
          value={muscle}
          onChange={setMuscle}
        />
      ) : null}

      {selectedExercise ? (
        <div className="rounded-lg border border-forge-copper/30 bg-forge-copper/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-forge-copper">Selected</p>
          <p className="mt-1 font-black text-white">{selectedExercise.name}</p>
          <p className="mt-1 text-sm text-orange-100">{selectedExercise.category} / {selectedExercise.exerciseType}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-bold text-slate-300">{!search && muscle === "All" ? "Popular baseline lifts" : "Matching exercises"}</p>
        <div className="grid max-h-[30rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {results.map(({ exercise, match }) => (
            <ExerciseImpactCard exercise={exercise} key={exercise._id || exercise.name} match={match} onSelect={(item) => onSelect(item.name)} />
          ))}
        </div>
        {!results.length ? <p className="rounded-lg border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">No exercises match that search.</p> : null}
      </div>
    </div>
  );
};

export default StrengthExerciseSelector;
