import { PlusCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import FormInput from "../FormInput.jsx";
import SelectInput from "../SelectInput.jsx";
import Button from "../Button.jsx";
import ExerciseImpactCard from "./ExerciseImpactCard.jsx";
import CustomExerciseForm from "./CustomExerciseForm.jsx";
import { exerciseService } from "../../services/exerciseService.js";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
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
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-forge-copper">Exercise Picker</p>
            <h2 className="text-xl font-black text-white">Choose movement</h2>
          </div>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 space-y-4 border-b border-white/10 p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {muscleFilters.filter((muscle) => muscle === "All" || broadCounts[muscle] > 0).map((muscle) => (
              <button
                className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black ${
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
                  className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black ${
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
          <div className="grid gap-3 md:grid-cols-4">
            <FormInput label="Search" placeholder="Pull-Up" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <SelectInput label="Type" options={typeOptions} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} />
            <SelectInput label="Equipment" options={equipmentOptions} value={filters.equipment} onChange={(event) => setFilters({ ...filters, equipment: event.target.value })} />
            <SelectInput label="Difficulty" options={difficultyOptions} value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {recentExercises.length ? (
            <section className="mb-5">
              <p className="mb-2 text-sm font-bold text-slate-300">Recent</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentExercises.slice(0, 8).map((exercise) => (
                  <button className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200" key={exercise.exerciseName} type="button" onClick={() => handleSelect(exercises.find((item) => item.name === exercise.exerciseName) || exercise)}>
                    {exercise.exerciseName}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {suggestions.length ? (
            <section className="mb-5">
              <p className="mb-2 text-sm font-bold text-slate-300">Smart suggestions</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestions.slice(0, 8).map((name) => (
                  <button className="shrink-0 rounded-full bg-forge-ember/15 px-3 py-2 text-sm font-semibold text-orange-200" key={name} type="button" onClick={() => handleSelect(exercises.find((item) => item.name === name) || { exerciseName: name, name })}>
                    {name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

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
