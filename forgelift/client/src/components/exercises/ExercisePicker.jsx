import { PlusCircle, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import SearchInput from "../ui/SearchInput.jsx";
import ExerciseTile from "./ExerciseTile.jsx";
import FilterSelect from "./FilterSelect.jsx";
import MuscleFilterChips from "./MuscleFilterChips.jsx";
import CustomExerciseForm from "./CustomExerciseForm.jsx";
import { titleCase } from "./exerciseMeta.js";
import { exerciseService } from "../../services/exerciseService.js";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { advancedMuscleFilters, filterAndRankExercises, getMuscleFilterCounts, muscleFilters } from "../../utils/exerciseMatchUtils.js";
import { getBroadMuscleImage, getMuscleImage } from "../../utils/muscleImages.js";

const TYPE_OPTIONS = ["compound", "isolation", "machine", "bodyweight", "cardio"].map((value) => ({ value, label: titleCase(value) }));
const EMPTY_FILTERS = { search: "", muscle: "All", type: "", equipment: "", difficulty: "" };

const optionsFrom = (exercises, key) =>
  [...new Set(exercises.map((exercise) => exercise[key]).filter(Boolean))].sort().map((value) => ({ value, label: titleCase(value) }));

const QuickChip = ({ children, tone = "neutral", onClick }) => (
  <button
    className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
      tone === "suggested" ? "border-forge-ember/30 bg-forge-ember/10 text-orange-200 hover:bg-forge-ember/20" : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
    }`}
    type="button"
    onClick={onClick}
  >
    {children}
  </button>
);

const ExercisePicker = ({ open, exercises = [], recentExercises = [], suggestions = [], onSelect, onClose }) => {
  const titleId = useId();
  const searchRef = useRef(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);

  const equipmentOptions = useMemo(() => optionsFrom(exercises, "equipment"), [exercises]);
  const difficultyOptions = useMemo(() => optionsFrom(exercises, "difficulty"), [exercises]);
  const ranked = useMemo(() => filterAndRankExercises({ exercises, ...filters }), [exercises, filters]);
  const countFilters = { search: filters.search, type: filters.type, equipment: filters.equipment, difficulty: filters.difficulty };
  const broadCounts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: countFilters, filterList: muscleFilters }),
    [exercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const advancedCounts = useMemo(
    () => getMuscleFilterCounts({ exercises, filters: countFilters, filterList: advancedMuscleFilters }),
    [exercises, filters.search, filters.type, filters.equipment, filters.difficulty]
  );
  const activeFilterCount = [filters.type, filters.equipment, filters.difficulty].filter(Boolean).length + (advancedMuscleFilters.includes(filters.muscle) ? 1 : 0);

  useBodyScrollLock(open);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setFilters((current) => ({ ...current, search: "" }));
    // Only focus search with a mouse; on phones the keyboard would cover the list.
    if (window.matchMedia?.("(pointer: fine)").matches) searchRef.current?.querySelector("input")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || createOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, createOpen]);

  if (!open) return null;

  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));

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

  const visibleMuscles = muscleFilters.filter((muscle) => muscle === "All" || broadCounts[muscle] > 0);
  const hasQuickPicks = recentExercises.length || suggestions.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm sm:p-4">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex h-full w-full flex-col overflow-clip bg-[#0b0d10] sm:mx-auto sm:max-w-5xl sm:rounded-[1.75rem] sm:border sm:border-white/10"
        role="dialog"
      >
        <div className="shrink-0 space-y-3 border-b border-white/[0.06] p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-white" id={titleId}>
              Add an exercise
            </h2>
            <button
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              type="button"
              onClick={onClose}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2" ref={searchRef}>
            <SearchInput className="min-w-0 flex-1" placeholder="Search exercises or muscles" value={filters.search} onChange={(event) => update({ search: event.target.value })} />
            <button
              aria-expanded={filtersOpen}
              className={`relative flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                filtersOpen || activeFilterCount ? "border-forge-ember/40 bg-forge-ember/10 text-orange-200" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
              }`}
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sr-only sm:hidden">Filters</span>
              {activeFilterCount ? <span className="rounded-full bg-forge-ember px-1.5 text-xs font-black text-[#160a02]">{activeFilterCount}</span> : null}
            </button>
          </div>

          <MuscleFilterChips counts={broadCounts} imageFor={getBroadMuscleImage} muscles={visibleMuscles} value={filters.muscle} onChange={(muscle) => update({ muscle })} />

          {filtersOpen ? (
            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex flex-wrap gap-2">
                <FilterSelect anyLabel="Any type" label="Type" options={TYPE_OPTIONS} value={filters.type} onChange={(type) => update({ type })} />
                <FilterSelect anyLabel="Any equipment" label="Equipment" options={equipmentOptions} value={filters.equipment} onChange={(equipment) => update({ equipment })} />
                <FilterSelect anyLabel="Any level" label="Difficulty" options={difficultyOptions} value={filters.difficulty} onChange={(difficulty) => update({ difficulty })} />
              </div>
              <button className="text-sm font-semibold text-orange-300 hover:text-orange-200" type="button" onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? "Hide specific muscles" : "Pick a specific muscle"}
              </button>
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
              {activeFilterCount ? (
                <button className="block text-sm font-semibold text-zinc-400 hover:text-white" type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, search: filters.search })}>
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {hasQuickPicks && !filters.search ? (
            <div className="mb-5 space-y-2">
              {recentExercises.length ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Recent and suggested</p> : <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Suggested</p>}
              <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:flex-wrap">
                {recentExercises.slice(0, 6).map((exercise) => (
                  <QuickChip key={`recent-${exercise.exerciseName}`} onClick={() => handleSelect(exercises.find((item) => item.name === exercise.exerciseName) || exercise)}>
                    {exercise.exerciseName}
                  </QuickChip>
                ))}
                {suggestions.slice(0, 6).map((name) => (
                  <QuickChip key={`suggested-${name}`} tone="suggested" onClick={() => handleSelect(exercises.find((item) => item.name === name) || { exerciseName: name, name })}>
                    {name}
                  </QuickChip>
                ))}
              </div>
            </div>
          ) : null}

          <p aria-live="polite" className="mb-3 text-sm text-zinc-500">
            {ranked.length} exercise{ranked.length === 1 ? "" : "s"}
          </p>

          {ranked.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {ranked.map(({ exercise, match }) => (
                <ExerciseTile adding exercise={exercise} key={exercise._id || exercise.name} match={match} onClick={handleSelect} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/12 p-8 text-center">
              <p className="font-display text-xl text-white">Nothing matches.</p>
              <p className="mt-1 text-sm text-zinc-400">Try fewer filters, or add it as your own exercise.</p>
            </div>
          )}

          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:w-auto"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle aria-hidden="true" className="h-4 w-4 text-orange-300" />
            Create your own exercise
          </button>
        </div>
      </div>
      <CustomExerciseForm loading={savingCustom} open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreateCustom} />
    </div>
  );
};

export default ExercisePicker;
