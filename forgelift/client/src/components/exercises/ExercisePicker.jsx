import { ChevronDown, ChevronUp, PlusCircle, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import SearchInput from "../ui/SearchInput.jsx";
import SelectInput from "../SelectInput.jsx";
import Button from "../Button.jsx";
import ExerciseImpactCard from "./ExerciseImpactCard.jsx";
import CustomExerciseForm from "./CustomExerciseForm.jsx";
import { exerciseService } from "../../services/exerciseService.js";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { advancedMuscleFilters, filterAndRankExercises, getMuscleFilterCounts, muscleFilters } from "../../utils/exerciseMatchUtils.js";

const typeOptions = [
  { value: "compound", label: "Compound" },
  { value: "isolation", label: "Isolation" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "cardio", label: "Cardio" }
];

const ExercisePicker = ({
  open,
  exercises = [],
  recentExercises = [],
  suggestions = [],
  onSelect,
  onClose
}) => {
  const [filters, setFilters] = useState({ search: "", muscle: "All", type: "", equipment: "", difficulty: "" });
  const [showAdvancedMuscles, setShowAdvancedMuscles] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const activeFilterCount = [filters.type, filters.equipment, filters.difficulty].filter(Boolean).length;
  const equipmentOptions = useMemo(
    () => [...new Set(exercises.map((exercise) => exercise.equipment).filter(Boolean))]
      .sort()
      .map((equipment) => ({ value: equipment, label: equipment })),
    [exercises]
  );
  const difficultyOptions = useMemo(
    () => [...new Set(exercises.map((exercise) => exercise.difficulty).filter(Boolean))]
      .sort()
      .map((difficulty) => ({ value: difficulty, label: difficulty })),
    [exercises]
  );
  const ranked = useMemo(() => filterAndRankExercises({ exercises, ...filters }), [exercises, filters]);
  const broadCounts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: { ...filters, muscle: "All" }, filterList: muscleFilters }),
    [exercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const advancedCounts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: { ...filters, muscle: "All" }, filterList: advancedMuscleFilters }),
    [exercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );

  useBodyScrollLock(open);

  if (!open) return null;

  const handleSelect = (exercise) => {
    onSelect(exercise);
    onClose();
  };

  const handleCreateCustom = async (payload) => {
    setSavingCustom(true);
    try {
      const data = await exerciseService.createCustomExercise(payload);
      setCreateOpen(false);
      handleSelect(data.exercise);
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 p-0 sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden border-white/10 bg-forge-panel sm:mx-auto sm:max-w-5xl sm:rounded-2xl sm:border">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-3">
          <h2 className="text-lg font-black text-white">Choose movement</h2>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 space-y-3 border-b border-white/10 p-3">
          <div className="flex items-center gap-2">
            <SearchInput className="flex-1" placeholder="Search exercises" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <button
              className={`relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-bold transition ${
                filtersOpen || activeFilterCount ? "border-forge-ember/50 bg-forge-ember/15 text-orange-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount ? <span className="ml-0.5 rounded-full bg-forge-ember px-1.5 py-0.5 text-xs text-white">{activeFilterCount}</span> : null}
              {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {muscleFilters.filter((muscle) => muscle === "All" || broadCounts[muscle] > 0).map((muscle) => (
              <button
                className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-black ${
                  filters.muscle === muscle ? "bg-forge-ember text-white" : "bg-white/10 text-slate-300"
                }`}
                key={muscle}
                type="button"
                onClick={() => setFilters({ ...filters, muscle })}
              >
                {muscle} {muscle !== "All" ? `(${broadCounts[muscle] || 0})` : ""}
              </button>
            ))}
          </div>

          {filtersOpen ? (
            <div className="space-y-3 rounded-lg bg-black/20 p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectInput label="Type" options={typeOptions} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} />
                <SelectInput label="Equipment" options={equipmentOptions} value={filters.equipment} onChange={(event) => setFilters({ ...filters, equipment: event.target.value })} />
                <SelectInput label="Difficulty" options={difficultyOptions} value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })} />
              </div>
              <button
                className="text-sm font-semibold text-forge-ember hover:text-orange-300"
                type="button"
                onClick={() => setShowAdvancedMuscles(!showAdvancedMuscles)}
              >
                {showAdvancedMuscles ? "Hide advanced muscles" : "Show advanced muscles"}
              </button>
              {showAdvancedMuscles ? (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {advancedMuscleFilters.filter((muscle) => advancedCounts[muscle] > 0).map((muscle) => (
                    <button
                      className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-black ${
                        filters.muscle === muscle ? "bg-forge-ember text-white" : "bg-white/10 text-slate-300"
                      }`}
                      key={muscle}
                      type="button"
                      onClick={() => setFilters({ ...filters, muscle })}
                    >
                      {muscle} ({advancedCounts[muscle] || 0})
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {recentExercises.length || suggestions.length ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {recentExercises.slice(0, 6).map((exercise) => (
                <button className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200" key={`recent-${exercise.exerciseName}`} type="button" onClick={() => handleSelect(exercises.find((item) => item.name === exercise.exerciseName) || exercise)}>
                  {exercise.exerciseName}
                </button>
              ))}
              {suggestions.slice(0, 6).map((name) => (
                <button className="shrink-0 rounded-full bg-forge-ember/15 px-3 py-1.5 text-xs font-semibold text-orange-200" key={`suggested-${name}`} type="button" onClick={() => handleSelect(exercises.find((item) => item.name === name) || { exerciseName: name, name })}>
                  {name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{ranked.length} exercise{ranked.length === 1 ? "" : "s"}</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ranked.map(({ exercise, match }) => (
              <ExerciseImpactCard exercise={exercise} key={exercise._id || exercise.name} match={match} onSelect={handleSelect} />
            ))}
          </div>
          {!ranked.length ? (
            <div className="rounded-lg border border-dashed border-white/15 p-6 text-center">
              <p className="text-slate-400">No exercises match those filters.</p>
              <Button className="mt-4" type="button" variant="secondary" onClick={() => setCreateOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Custom Exercise
              </Button>
            </div>
          ) : (
            <Button className="mt-5 w-full sm:w-auto" type="button" variant="secondary" onClick={() => setCreateOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Custom Exercise
            </Button>
          )}
        </div>
      </div>
      <CustomExerciseForm open={createOpen} loading={savingCustom} onClose={() => setCreateOpen(false)} onSave={handleCreateCustom} />
    </div>
  );
};

export default ExercisePicker;
