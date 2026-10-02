import { useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import Layout from "../components/Layout.jsx";
import CustomExerciseForm from "../components/exercises/CustomExerciseForm.jsx";
import ExerciseDetailSheet from "../components/exercises/ExerciseDetailSheet.jsx";
import ExerciseTile from "../components/exercises/ExerciseTile.jsx";
import FilterSelect from "../components/exercises/FilterSelect.jsx";
import MuscleFilterChips from "../components/exercises/MuscleFilterChips.jsx";
import { RoleLegend } from "../components/exercises/MuscleImpactBars.jsx";
import { titleCase } from "../components/exercises/exerciseMeta.js";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import { exerciseService } from "../services/exerciseService.js";
import { advancedMuscleFilters, filterAndRankExercises, getMuscleFilterCounts, muscleFilters } from "../utils/exerciseMatchUtils.js";
import { getBroadMuscleImage, getMuscleImage } from "../utils/muscleImages.js";

const PAGE_SIZE = 24;
const TYPE_OPTIONS = ["compound", "isolation", "machine", "bodyweight", "cardio"].map((value) => ({ value, label: titleCase(value) }));
const EMPTY_FILTERS = { search: "", muscle: "All", type: "", equipment: "", difficulty: "" };

const optionsFrom = (exercises, key) =>
  [...new Set(exercises.map((exercise) => exercise[key]).filter(Boolean))].sort().map((value) => ({ value, label: titleCase(value) }));

const ExerciseLibraryPage = () => {
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [source, setSource] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await exerciseService.getExercises();
      setExercises(data.exercises || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => setVisible(PAGE_SIZE), [filters, source]);

  const pool = useMemo(
    () => exercises.filter((exercise) => (source === "custom" ? exercise.isCustom : source === "default" ? !exercise.isCustom : true)),
    [exercises, source]
  );
  const results = useMemo(() => filterAndRankExercises({ exercises: pool, ...filters }), [pool, filters]);
  const countFilters = { search: filters.search, type: filters.type, equipment: filters.equipment, difficulty: filters.difficulty };
  const broadCounts = useMemo(
    () => getMuscleFilterCounts({ exercises: pool, filters: countFilters, filterList: muscleFilters }),
    [pool, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const advancedCounts = useMemo(
    () => (showAdvanced ? getMuscleFilterCounts({ exercises: pool, filters: countFilters, filterList: advancedMuscleFilters }) : {}),
    [showAdvanced, pool, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const equipmentOptions = useMemo(() => optionsFrom(exercises, "equipment"), [exercises]);
  const difficultyOptions = useMemo(() => optionsFrom(exercises, "difficulty"), [exercises]);
  const customCount = exercises.filter((exercise) => exercise.isCustom).length;
  const hasFilters = source !== "all" || Object.entries(filters).some(([key, value]) => (key === "muscle" ? value !== "All" : Boolean(value)));

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const data = editing?._id ? await exerciseService.updateCustomExercise(editing._id, payload) : await exerciseService.createCustomExercise(payload);
      setFormOpen(false);
      setEditing(null);
      await load();
      if (data?.exercise) setSelected(data.exercise);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    const id = pendingDeleteId;
    const removed = exercises.find((exercise) => exercise._id === id);
    setPendingDeleteId("");
    setSelected(null);
    setError("");
    setExercises((current) => current.filter((exercise) => exercise._id !== id));
    exerciseService.deleteCustomExercise(id).catch((err) => {
      setError(err.message);
      if (removed) setExercises((current) => [...current, removed]);
    });
  };

  return (
    <Layout>
      {pendingDeleteId ? (
        <ConfirmModal
          confirmLabel="Delete"
          description="Workouts you already logged with it stay saved."
          title="Delete this exercise?"
          onCancel={() => setPendingDeleteId("")}
          onConfirm={confirmDelete}
        />
      ) : null}
      <ExerciseDetailSheet
        exercise={formOpen ? null : selected}
        onClose={() => setSelected(null)}
        onDelete={setPendingDeleteId}
        onEdit={(exercise) => {
          setEditing(exercise);
          setFormOpen(true);
        }}
      />
      <CustomExerciseForm
        initialExercise={editing}
        loading={saving}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <PageHeader
        actions={
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            data-tour-id="exercise-create-custom"
            type="button"
            onClick={openCreate}
          >
            <PlusCircle aria-hidden="true" className="h-4 w-4" />
            Create exercise
          </button>
        }
        description="Every movement shows which muscles it trains and how hard. Tap one for the full breakdown."
        eyebrow="Exercise library"
        title="Know what every lift hits"
        tutorialPageKey="exercise_library"
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1" data-tour-id="exercise-search">
            <SearchInput placeholder="Search name, muscle or equipment" value={filters.search} onChange={(event) => update({ search: event.target.value })} />
          </div>
          <SegmentedControl
            className="w-full sm:w-auto"
            fill
            options={[
              { value: "all", label: "All" },
              { value: "default", label: "ForgeLift" },
              { value: "custom", label: customCount ? `Yours (${customCount})` : "Yours" }
            ]}
            value={source}
            onChange={setSource}
          />
        </div>

        <MuscleFilterChips
          counts={broadCounts}
          imageFor={getBroadMuscleImage}
          muscles={muscleFilters.filter((muscle) => muscle === "All" || broadCounts[muscle] > 0)}
          tourId="exercise-filter-chips"
          value={filters.muscle}
          onChange={(muscle) => update({ muscle })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect anyLabel="Any type" label="Type" options={TYPE_OPTIONS} value={filters.type} onChange={(type) => update({ type })} />
          <FilterSelect anyLabel="Any equipment" label="Equipment" options={equipmentOptions} value={filters.equipment} onChange={(equipment) => update({ equipment })} />
          <FilterSelect anyLabel="Any level" label="Difficulty" options={difficultyOptions} value={filters.difficulty} onChange={(difficulty) => update({ difficulty })} />
          <button
            aria-expanded={showAdvanced}
            className="min-h-11 rounded-full px-3 text-sm font-semibold text-orange-300 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            {showAdvanced ? "Hide specific muscles" : "Specific muscles"}
          </button>
        </div>

        {showAdvanced ? (
          <MuscleFilterChips
            counts={advancedCounts}
            imageFor={getMuscleImage}
            label="Filter by specific muscle"
            muscles={advancedMuscleFilters.filter((muscle) => advancedCounts[muscle] > 0)}
            value={filters.muscle}
            onChange={(muscle) => update({ muscle })}
          />
        ) : null}
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p aria-live="polite" className="text-sm text-zinc-400">
          {loading ? "Loading exercises..." : `${results.length} exercise${results.length === 1 ? "" : "s"}`}
          {hasFilters && !loading ? (
            <button
              className="ml-3 font-semibold text-orange-300 hover:text-orange-200"
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSource("all");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </p>
        <RoleLegend roles={["primary", "secondary", "stabiliser"]} />
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {loading ? (
        <div aria-busy="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="h-48 animate-pulse rounded-3xl bg-white/[0.03]" key={index} />
          ))}
        </div>
      ) : null}

      {!loading && !error && !results.length ? (
        <div className="rounded-3xl border border-dashed border-white/12 px-6 py-12 text-center">
          <p className="font-display text-2xl text-white">{source === "custom" && !customCount ? "No exercises of your own yet." : "Nothing matches."}</p>
          <p className="mx-auto mt-2 max-w-md text-zinc-400">
            {source === "custom" && !customCount ? "If ForgeLift doesn't have a movement you do, add it with your own muscle targets." : "Try fewer filters, or add the movement yourself."}
          </p>
          <button
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09]"
            type="button"
            onClick={openCreate}
          >
            <PlusCircle aria-hidden="true" className="h-4 w-4 text-orange-300" />
            Create exercise
          </button>
        </div>
      ) : null}

      {!loading && results.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, visible).map(({ exercise, match }, index) => (
              <ExerciseTile exercise={exercise} key={exercise._id || exercise.name} match={match} tourId={index === 0 ? "exercise-card" : undefined} onClick={setSelected} />
            ))}
          </div>
          {results.length > visible ? (
            <div className="mt-6 text-center">
              <button
                className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-6 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
              >
                Show more ({results.length - visible} left)
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </Layout>
  );
};

export default ExerciseLibraryPage;
