import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Edit3, PlusCircle, Search, Trash2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import FormInput from "../components/FormInput.jsx";
import SelectInput from "../components/SelectInput.jsx";
import Button from "../components/Button.jsx";
import CustomExerciseForm from "../components/exercises/CustomExerciseForm.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { exerciseService } from "../services/exerciseService.js";
import { advancedMuscleFilters, getMuscleFilterCounts, muscleFilters } from "../utils/exerciseMatchUtils.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const typeOptions = [
  { value: "compound", label: "Compound" },
  { value: "isolation", label: "Isolation" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "cardio", label: "Cardio" }
];

const equipmentOptions = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "smith machine",
  "kettlebell",
  "treadmill",
  "bike"
].map((equipment) => ({ value: equipment, label: equipment.replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

const difficultyOptions = ["Beginner", "Intermediate", "Advanced"].map((difficulty) => ({
  value: difficulty,
  label: difficulty
}));

const getMatchBadge = (exercise, activeMuscle) => {
  if (!activeMuscle) return null;

  const normalize = (value) => value.toLowerCase();
  const target = normalize(activeMuscle);
  const includesTarget = (value = "") => normalize(value).includes(target) || target.includes(normalize(value));
  const findMatch = (items = []) => items.find((item) => includesTarget(item));

  const primary = findMatch(exercise.primaryMuscles);
  if (primary) return { label: `Primary: ${primary}`, className: "bg-emerald-500/15 text-emerald-200" };

  const secondary = findMatch(exercise.secondaryMuscles);
  if (secondary) return { label: `Secondary: ${secondary}`, className: "bg-amber-500/15 text-amber-200" };

  const stabiliser = findMatch(exercise.stabiliserMuscles);
  if (stabiliser) return { label: `Stabiliser: ${stabiliser}`, className: "bg-violet-500/15 text-violet-200" };

  if (includesTarget(exercise.category || "")) {
    return { label: `Category: ${exercise.category}`, className: "bg-sky-500/15 text-sky-200" };
  }

  const impact = Object.keys(exercise.impactProfile || {}).find((muscle) => includesTarget(muscle));
  if (impact) return { label: `Impact: ${impact}`, className: "bg-white/10 text-slate-200" };

  return null;
};

const ExerciseCard = ({ exercise, activeMuscle, onEdit, onDelete, tourId }) => {
  const matchBadge = getMatchBadge(exercise, activeMuscle);

  return (
    <article data-tour-id={tourId} className="metal-panel rounded-lg p-5 shadow-metal">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-forge-copper">
            {exercise.category}
          </p>
          <h2 className="mt-2 text-xl font-black text-white">{exercise.name}</h2>
        </div>
        <span className="rounded-md bg-white/10 p-2 text-forge-ember">
          <Dumbbell className="h-5 w-5" />
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
        {matchBadge ? (
          <span className={`rounded-full px-3 py-1 ${matchBadge.className}`}>{matchBadge.label}</span>
        ) : null}
        <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-orange-200">
          {exercise.exerciseType}
        </span>
        {exercise.isCustom ? <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">Custom</span> : null}
        {exercise.equipment ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{exercise.equipment}</span>
        ) : null}
        {exercise.difficulty ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{exercise.difficulty}</span>
        ) : null}
        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
          {exercise.defaultRepMin}-{exercise.defaultRepMax} reps
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
          +{exercise.overloadIncrementKg}kg
        </span>
      </div>
      {exercise.isCustom ? (
        <div className="mb-4 flex gap-2">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/15" type="button" onClick={() => onEdit(exercise)}>
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-red-500/10 px-3 text-sm font-semibold text-red-100 hover:bg-red-500/20" type="button" onClick={() => onDelete(exercise._id)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}

      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 font-semibold text-slate-300">Primary</p>
          <p className="text-slate-400">{exercise.primaryMuscles.join(", ") || "None listed"}</p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-300">Secondary</p>
          <p className="text-slate-400">{exercise.secondaryMuscles.join(", ") || "None listed"}</p>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-300">Stabiliser</p>
          <p className="text-slate-400">{exercise.stabiliserMuscles.join(", ") || "None listed"}</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-slate-300">Impact profile</p>
          <div className="space-y-2">
            {Object.entries(exercise.impactProfile || {}).map(([muscle, impact]) => (
              <div className="flex items-center gap-3" key={muscle}>
                <span className="w-28 shrink-0 text-slate-400">{muscle}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forge-copper to-forge-ember"
                    style={{ width: `${Math.min(Number(impact) || 0, 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-300">{impact}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

const ExerciseLibraryPage = () => {
  const [exercises, setExercises] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [filters, setFilters] = useState({ search: "", muscle: "", type: "", equipment: "", difficulty: "" });
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAdvancedMuscles, setShowAdvancedMuscles] = useState(false);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [savingCustom, setSavingCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAllExercises = async () => {
      try {
        const data = await exerciseService.getExercises();
        setAllExercises(data.exercises || []);
      } catch (_err) {
        setAllExercises([]);
      }
    };
    loadAllExercises();
  }, []);

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await exerciseService.getExercises(filters);
        const loaded = data.exercises || [];
        setExercises(
          loaded.filter((exercise) =>
            sourceFilter === "custom" ? exercise.isCustom : sourceFilter === "default" ? !exercise.isCustom : true
          )
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [filters, sourceFilter]);

  const hasFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);
  const countExercises = allExercises.length ? allExercises : exercises;
  const countFilters = { search: filters.search, type: filters.type, equipment: filters.equipment, difficulty: filters.difficulty };
  const broadCounts = useMemo(
    () => getMuscleFilterCounts({ exercises: countExercises, filters: countFilters, filterList: muscleFilters }),
    [countExercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const advancedCounts = useMemo(
    () => getMuscleFilterCounts({ exercises: countExercises, filters: countFilters, filterList: advancedMuscleFilters }),
    [countExercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );

  const handleSaveCustom = async (payload) => {
    setSavingCustom(true);
    try {
      if (editingExercise?._id) {
        await exerciseService.updateCustomExercise(editingExercise._id, payload);
      } else {
        await exerciseService.createCustomExercise(payload);
      }
      setCustomFormOpen(false);
      setEditingExercise(null);
      const data = await exerciseService.getExercises();
      setAllExercises(data.exercises || []);
      setFilters({ ...filters });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCustom(false);
    }
  };

  const handleDeleteCustom = async (id) => {
    if (!window.confirm("Delete this custom exercise? Workouts already logged will stay saved.")) return;
    try {
      await exerciseService.deleteCustomExercise(id);
      const data = await exerciseService.getExercises();
      setAllExercises(data.exercises || []);
      setExercises((current) => current.filter((exercise) => exercise._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">
            Exercise Library
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Training movements</h1>
        </div>
        <button
          className="mb-4 text-sm font-semibold text-forge-ember hover:text-orange-300"
          type="button"
          onClick={() => setShowAdvancedMuscles(!showAdvancedMuscles)}
        >
          {showAdvancedMuscles ? "Hide advanced muscles" : "Show advanced muscles"}
        </button>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button data-tour-id="exercise-create-custom" type="button" onClick={() => { setEditingExercise(null); setCustomFormOpen(true); }}>
            <PlusCircle className="h-4 w-4" />
            Create Exercise
          </Button>
          <TutorialLauncher pageKey="exercise_library" steps={getTutorialSteps("exercise_library")} />
          <p className="text-sm text-slate-400">{exercises.length} exercises found</p>
        </div>
      </div>

      <section className="metal-panel mb-6 rounded-lg p-5">
        <div data-tour-id="exercise-filter-chips" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible">
          {[
            ["all", "All"],
            ["default", "ForgeLift Exercises"],
            ["custom", "My Custom Exercises"]
          ].map(([value, label]) => (
            <button
              className={`min-h-10 shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                sourceFilter === value ? "bg-cyan-500/20 text-cyan-100" : "bg-white/10 text-slate-300 hover:bg-white/15"
              }`}
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible">
          {muscleFilters.filter((muscle) => muscle === "All" || broadCounts[muscle] > 0).map((muscle) => {
            const value = muscle === "All" ? "" : muscle;
            const active = filters.muscle === value;

            return (
              <button
                key={muscle}
                type="button"
                className={`min-h-10 shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-forge-ember text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                }`}
                onClick={() => setFilters({ ...filters, muscle: value })}
              >
                {muscle} {muscle !== "All" ? `(${broadCounts[muscle] || 0})` : ""}
              </button>
            );
          })}
        </div>
        {showAdvancedMuscles ? (
          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2">
            {advancedMuscleFilters.filter((muscle) => advancedCounts[muscle] > 0).map((muscle) => {
              const active = filters.muscle === muscle;
              return (
                <button
                  key={muscle}
                  type="button"
                  className={`min-h-10 shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-forge-ember text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                  }`}
                  onClick={() => setFilters({ ...filters, muscle })}
                >
                  {muscle} ({advancedCounts[muscle] || 0})
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div data-tour-id="exercise-search">
          <FormInput
            label="Search by name"
            placeholder="Bench Press"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          </div>
          <SelectInput
            label="Exercise type"
            options={typeOptions}
            value={filters.type}
            onChange={(event) => setFilters({ ...filters, type: event.target.value })}
          />
          <SelectInput
            label="Equipment"
            options={equipmentOptions}
            value={filters.equipment}
            onChange={(event) => setFilters({ ...filters, equipment: event.target.value })}
          />
          <SelectInput
            label="Difficulty"
            options={difficultyOptions}
            value={filters.difficulty}
            onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
          />
        </div>
        {hasFilters ? (
          <button
            className="mt-4 text-sm font-semibold text-forge-ember hover:text-orange-300"
            onClick={() => { setFilters({ search: "", muscle: "", type: "", equipment: "", difficulty: "" }); setSourceFilter("all"); }}
          >
            Clear filters
          </button>
        ) : null}
      </section>

      {loading ? <LoadingSkeleton rows={6} variant="card" /> : null}
      {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error && exercises.length === 0 ? (
        <div className="metal-panel rounded-lg p-8 text-center text-slate-400">
          <Search className="mx-auto mb-3 h-8 w-8 text-forge-copper" />
          No exercises match those filters.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            exercise={exercise}
            activeMuscle={filters.muscle}
            key={exercise._id}
            tourId={index === 0 ? "exercise-card" : undefined}
            onDelete={handleDeleteCustom}
            onEdit={(item) => {
              setEditingExercise(item);
              setCustomFormOpen(true);
            }}
          />
        ))}
      </div>
      <CustomExerciseForm
        initialExercise={editingExercise}
        loading={savingCustom}
        open={customFormOpen}
        onClose={() => {
          setCustomFormOpen(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveCustom}
      />
    </Layout>
  );
};

export default ExerciseLibraryPage;
