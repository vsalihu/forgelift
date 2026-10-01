import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import SessionSummary from "../components/gym/SessionSummary.jsx";
import { exerciseSuggestion, exerciseVolume, formatNumber, isBodyweightExercise } from "../components/gym/gymUtils.js";
import { GymModeIcon } from "../components/icons/navIcons.jsx";
import LoggerExerciseCard from "../components/logger/LoggerExerciseCard.jsx";
import SessionDetails, { toLocalDay } from "../components/logger/SessionDetails.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { overloadService } from "../services/overloadService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";
import { workoutService } from "../services/workoutService.js";
import { copySetForNext, createEmptySet, isSetValid, normalizeSetForSave } from "../utils/workoutSetUtils.js";

const DRAFT_KEY = "forgeliftWorkoutLoggerDraft";

// Client-only id so cards keep their identity when reordered. Stripped before saving.
const newKey = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const withKeys = (list = []) => list.map((exercise) => (exercise._key ? exercise : { ...exercise, _key: newKey() }));

const emptyForm = () => ({
  title: "",
  date: toLocalDay(),
  notes: "",
  sessionRPE: "",
  soreness: "",
  sleepQuality: "",
  energyLevel: "",
  exercises: []
});

const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (_error) {
      // Drafts are a convenience; logging still works without storage.
    }
  }
};

const loadInitialDraft = () => {
  const draft = storage.get(DRAFT_KEY);
  if (!draft) return { form: emptyForm(), restored: false };

  try {
    const parsed = JSON.parse(draft);
    if (!parsed.exercises?.length && !parsed.title && !parsed.notes) {
      return { form: emptyForm(), restored: false };
    }
    return { form: { ...emptyForm(), ...parsed, exercises: withKeys(parsed.exercises) }, restored: Boolean(parsed.exercises?.length) };
  } catch (_error) {
    storage.set(DRAFT_KEY, null);
    return { form: emptyForm(), restored: false };
  }
};

// A set with nothing typed into it is skipped on save rather than blocking it.
const isBlankSet = (set, exercise) => {
  if (String(set.reps ?? "").trim()) return false;
  if (isBodyweightExercise(exercise)) return set.bodyweightOnly !== false || !Number(set.addedLoad);
  return !String(set.weight ?? "").trim();
};

const WorkoutLoggerPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const bodyweight = Number(user?.bodyweight) || 0;
  const initialDraft = useMemo(() => (isEditMode ? { form: emptyForm(), restored: false } : loadInitialDraft()), [isEditMode]);
  const [exercises, setExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [strengthBaselines, setStrengthBaselines] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingWorkout, setLoadingWorkout] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [savedResult, setSavedResult] = useState(null);
  const [draftRestored, setDraftRestored] = useState(initialDraft.restored);
  const [openSet, setOpenSet] = useState(null);
  const [removed, setRemoved] = useState(null);
  const [form, setForm] = useState(initialDraft.form);
  const [originalDate, setOriginalDate] = useState(null);
  const skipDraftSaveRef = useRef(false);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const [exerciseData, recentData, overloadData, baselineData] = await Promise.all([
          exerciseService.getExercises(),
          workoutService.getRecentExercises(),
          overloadService.getOverloadRecommendations(),
          strengthBaselineService.getStrengthBaselines()
        ]);
        setExercises(exerciseData.exercises || []);
        setRecentExercises(recentData.exercises || []);
        setOverloadRecommendations(overloadData.recommendations || []);
        setStrengthBaselines(baselineData.baselines || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingExercises(false);
      }
    };

    loadExercises();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadExistingWorkout = async () => {
      setLoadingWorkout(true);
      try {
        const data = await workoutService.getWorkout(id);
        const workout = data.workout;
        setOriginalDate(workout.date || null);
        setForm({
          title: workout.title || "",
          date: toLocalDay(workout.date || new Date()),
          notes: workout.notes || "",
          sessionRPE: workout.sessionRPE ?? "",
          soreness: workout.soreness ?? "",
          sleepQuality: workout.sleepQuality ?? "",
          energyLevel: workout.energyLevel ?? "",
          exercises: (workout.exercises || []).map((exercise) => ({
            _key: newKey(),
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            exerciseType: exercise.exerciseType || "",
            mainMuscleGroups: exercise.mainMuscleGroups || [],
            detailedMuscles: exercise.detailedMuscles || [],
            primaryMuscles: exercise.primaryMuscles || [],
            secondaryMuscles: exercise.secondaryMuscles || [],
            stabiliserMuscles: exercise.stabiliserMuscles || [],
            impactProfile: exercise.impactProfile || {},
            sets: (exercise.sets || []).map((set) => ({
              ...createEmptySet({ exerciseType: exercise.exerciseType, bodyweight: user?.bodyweight }),
              ...set,
              weight: set.weight ?? "",
              reps: set.reps ?? "",
              rpe: set.rpe ?? ""
            }))
          }))
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingWorkout(false);
      }
    };

    loadExistingWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode || savedResult) return;

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      storage.set(DRAFT_KEY, null);
      return;
    }

    if (!form.exercises.length && !form.title && !form.notes) {
      storage.set(DRAFT_KEY, null);
      return;
    }

    storage.set(DRAFT_KEY, JSON.stringify(form));
  }, [form, isEditMode, savedResult]);

  useEffect(() => {
    if (!removed) return undefined;
    const timeout = window.setTimeout(() => setRemoved(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [removed]);

  const suggestedExerciseNames = useMemo(() => overloadRecommendations.slice(0, 8).map((item) => item.exerciseName), [overloadRecommendations]);
  const historyFor = (name) => recentExercises.find((item) => item.exerciseName === name);
  const suggestionFor = (name) =>
    exerciseSuggestion(
      overloadRecommendations.find((item) => item.exerciseName === name),
      strengthBaselines.find((item) => item.exerciseName === name)
    );

  // Per exercise, the sets that would block saving. Only shown after a save attempt.
  const invalidByExercise = useMemo(
    () =>
      form.exercises.map((exercise) => {
        const invalid = new Set();
        const filled = exercise.sets.filter((set) => !isBlankSet(set, exercise));
        exercise.sets.forEach((set, setIndex) => {
          if (isBodyweightExercise(exercise) && !bodyweight) invalid.add(setIndex);
          else if (!isBlankSet(set, exercise) && !isSetValid(set)) invalid.add(setIndex);
        });
        if (!filled.length) invalid.add(0);
        return invalid;
      }),
    [form.exercises, bodyweight]
  );
  const hasInvalid = invalidByExercise.some((invalid) => invalid.size > 0);

  const totals = useMemo(() => {
    const sets = form.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => !isBlankSet(set, exercise) && isSetValid(set)).length, 0);
    const volume = form.exercises.reduce((total, exercise) => total + exerciseVolume(exercise), 0);
    return { sets, volume };
  }, [form.exercises]);

  const discardDraft = () => {
    skipDraftSaveRef.current = true;
    setForm(emptyForm());
    setDraftRestored(false);
    setShowErrors(false);
  };

  const addExerciseObject = (exercise) => {
    if (!exercise) return;
    const exerciseType = exercise.exerciseType || "";
    const nextIndex = form.exercises.length;
    setError("");
    setForm((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          _key: newKey(),
          exerciseId: exercise._id || exercise.exerciseId,
          exerciseName: exercise.name || exercise.exerciseName,
          exerciseType,
          mainMuscleGroups: exercise.mainMuscleGroups || [],
          detailedMuscles: exercise.detailedMuscles || [],
          primaryMuscles: exercise.primaryMuscles || [],
          secondaryMuscles: exercise.secondaryMuscles || [],
          stabiliserMuscles: exercise.stabiliserMuscles || [],
          impactProfile: exercise.impactProfile || {},
          sets: [createEmptySet({ exerciseType, bodyweight: user?.bodyweight })]
        }
      ]
    }));
    window.setTimeout(() => document.getElementById(`logger-exercise-${nextIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  const addExerciseByName = (exerciseName) => {
    addExerciseObject(exercises.find((item) => item.name === exerciseName) || recentExercises.find((item) => item.exerciseName === exerciseName));
  };

  const updateExercise = (exerciseIndex, update) =>
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => (index === exerciseIndex ? update(exercise) : exercise))
    }));

  const patchSet = (exerciseIndex, setIndex, patch) =>
    updateExercise(exerciseIndex, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set, index) => (index === setIndex ? { ...set, ...patch } : set))
    }));

  const changeSet = (exerciseIndex, setIndex, field, value) => {
    if (field === "addedLoad") {
      const added = Number(value) || 0;
      patchSet(exerciseIndex, setIndex, { addedLoad: value, bodyweightUsed: bodyweight || "", weight: bodyweight + added, totalLoad: bodyweight + added });
      return;
    }
    patchSet(exerciseIndex, setIndex, { [field]: value });
  };

  const addSet = (exerciseIndex) =>
    updateExercise(exerciseIndex, (exercise) => {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      const next = lastSet ? copySetForNext(lastSet) : createEmptySet({ exerciseType: exercise.exerciseType, bodyweight: user?.bodyweight });
      return { ...exercise, sets: [...exercise.sets, next] };
    });

  const removeSet = (exerciseIndex, setIndex) => {
    updateExercise(exerciseIndex, (exercise) => ({
      ...exercise,
      sets: exercise.sets.length > 1 ? exercise.sets.filter((_set, index) => index !== setIndex) : exercise.sets
    }));
    setOpenSet(null);
  };

  const removeExercise = (exerciseIndex) => {
    setRemoved({ exercise: form.exercises[exerciseIndex], index: exerciseIndex });
    setForm((current) => ({ ...current, exercises: current.exercises.filter((_exercise, index) => index !== exerciseIndex) }));
    setOpenSet(null);
  };

  const undoRemove = () => {
    if (!removed) return;
    setForm((current) => {
      const next = [...current.exercises];
      next.splice(Math.min(removed.index, next.length), 0, removed.exercise);
      return { ...current, exercises: next };
    });
    setRemoved(null);
  };

  const moveExercise = (exerciseIndex, direction) => {
    const target = exerciseIndex + direction;
    if (target < 0 || target >= form.exercises.length) return;
    setForm((current) => {
      const next = [...current.exercises];
      [next[exerciseIndex], next[target]] = [next[target], next[exerciseIndex]];
      return { ...current, exercises: next };
    });
    setOpenSet(null);
  };

  const setBodyweightMode = (exerciseIndex, weighted) =>
    updateExercise(exerciseIndex, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        bodyweightOnly: !weighted,
        bodyweightUsed: bodyweight || null,
        addedLoad: weighted ? set.addedLoad || "" : 0,
        weight: bodyweight + (weighted ? Number(set.addedLoad) || 0 : 0),
        totalLoad: bodyweight + (weighted ? Number(set.addedLoad) || 0 : 0)
      }))
    }));

  // Fills sets that are still missing weight or reps.
  const useSuggestion = (exerciseIndex) => {
    const exercise = form.exercises[exerciseIndex];
    const suggestion = suggestionFor(exercise?.exerciseName);
    if (!suggestion) return;
    const total = Number(suggestion.weight) || 0;
    updateExercise(exerciseIndex, (current) => ({
      ...current,
      sets: current.sets.map((set) => {
        if (isSetValid(set)) return set;
        const reps = set.reps || suggestion.reps;
        if (isBodyweightExercise(current) && bodyweight) {
          const added = Math.max(0, total - bodyweight);
          return { ...set, reps, bodyweightUsed: bodyweight, addedLoad: added, bodyweightOnly: added === 0, weight: bodyweight + added, totalLoad: bodyweight + added };
        }
        return { ...set, reps, weight: set.weight || String(total || "") };
      })
    }));
  };

  const dateForSave = () => {
    if (originalDate && toLocalDay(originalDate) === form.date) return originalDate;
    if (form.date === toLocalDay()) return new Date().toISOString();
    return new Date(`${form.date}T12:00:00`).toISOString();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.exercises.length) {
      setError("Add at least one exercise before saving.");
      return;
    }

    if (hasInvalid) {
      setShowErrors(true);
      const first = invalidByExercise.findIndex((invalid) => invalid.size > 0);
      setError(
        isBodyweightExercise(form.exercises[first]) && !bodyweight
          ? "Add your bodyweight in your profile to save bodyweight exercises."
          : "Some sets need weight and reps before you can save."
      );
      document.getElementById(`logger-exercise-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setError("");
    setShowErrors(false);
    setSubmitting(true);

    const { date: _day, ...rest } = form;
    const payload = {
      ...rest,
      date: dateForSave(),
      exercises: form.exercises.map(({ _key: _ignored, ...exercise }) => ({
        ...exercise,
        sets: exercise.sets.filter((set) => !isBlankSet(set, exercise)).map(({ done: _done, ...set }) => normalizeSetForSave(set))
      }))
    };

    try {
      if (isEditMode) {
        await workoutService.updateWorkout(id, payload);
        navigate(`/workouts/${id}`);
        return;
      }

      const data = await workoutService.createWorkout(payload);
      storage.set(DRAFT_KEY, null);
      setSavedResult({ ...data, title: form.title || "Workout" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startAnother = () => {
    skipDraftSaveRef.current = true;
    setSavedResult(null);
    setForm(emptyForm());
    setDraftRestored(false);
    window.scrollTo({ top: 0 });
  };

  const loading = isEditMode && loadingWorkout;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          actions={
            isEditMode ? null : (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/gym-mode"
              >
                <GymModeIcon className="h-4 w-4" />
                Training now? Gym Mode
              </Link>
            )
          }
          description={
            isEditMode
              ? "Saving recalculates your PRs, ranks and recovery from this session."
              : "For a session you've already done. Add the exercises, then the sets you lifted."
          }
          eyebrow={isEditMode ? "Edit workout" : "Log workout"}
          title={isEditMode ? "Edit this session" : "Log a session"}
          tutorialPageKey={isEditMode ? undefined : "workout_logger"}
        />

        {draftRestored && form.exercises.length ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-forge-copper/30 bg-forge-copper/[0.08] py-2 pl-4 pr-2">
            <p className="min-w-0 flex-1 text-sm text-orange-100">Your unsaved session is still here.</p>
            <button className="min-h-10 shrink-0 rounded-full px-3 text-sm font-bold text-orange-200 hover:bg-white/[0.06]" type="button" onClick={discardDraft}>
              Discard
            </button>
            <button className="min-h-10 shrink-0 rounded-full bg-white/[0.06] px-4 text-sm font-bold text-white hover:bg-white/[0.1]" type="button" onClick={() => setDraftRestored(false)}>
              Keep
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <form noValidate onSubmit={handleSubmit}>
            <SessionDetails form={form} showRpeGuide={user?.beginnerTipsEnabled !== false} onChange={setForm} />

            <section aria-labelledby="logger-exercises-heading" className="mt-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl text-white" id="logger-exercises-heading">
                  Exercises
                </h2>
                {form.exercises.length ? <span className="text-sm text-zinc-500">{form.exercises.length} added</span> : null}
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {form.exercises.map((exercise, exerciseIndex) => (
                    <motion.div exit={{ opacity: 0, height: 0, marginTop: 0 }} key={exercise._key || `${exercise.exerciseName}-${exerciseIndex}`} transition={{ duration: 0.25 }}>
                      <LoggerExerciseCard
                        bodyweight={bodyweight}
                        exercise={exercise}
                        history={historyFor(exercise.exerciseName)}
                        index={exerciseIndex}
                        invalidSets={showErrors ? invalidByExercise[exerciseIndex] : new Set()}
                        openSet={openSet?.exercise === exerciseIndex ? openSet.set : null}
                        suggestion={suggestionFor(exercise.exerciseName)}
                        total={form.exercises.length}
                        tourSetEntry={exerciseIndex === 0}
                        onAddSet={() => addSet(exerciseIndex)}
                        onBodyweightMode={(weighted) => setBodyweightMode(exerciseIndex, weighted)}
                        onMove={(direction) => moveExercise(exerciseIndex, direction)}
                        onRemove={() => removeExercise(exerciseIndex)}
                        onRemoveSet={(setIndex) => removeSet(exerciseIndex, setIndex)}
                        onSetChange={(setIndex, field, value) => changeSet(exerciseIndex, setIndex, field, value)}
                        onSetPatch={(setIndex, patch) => patchSet(exerciseIndex, setIndex, patch)}
                        onToggleOpen={(setIndex) =>
                          setOpenSet((current) => (current?.exercise === exerciseIndex && current.set === setIndex ? null : { exercise: exerciseIndex, set: setIndex }))
                        }
                        onUseSuggestion={() => useSuggestion(exerciseIndex)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className={`rounded-3xl border border-dashed border-white/15 p-4 sm:p-5 ${form.exercises.length ? "mt-3" : ""}`} data-tour-id="logger-add-exercise">
                <button
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-400 to-forge-ember text-base font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_34px_-14px_rgba(249,115,22,0.9)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.99] disabled:opacity-60"
                  disabled={loadingExercises}
                  type="button"
                  onClick={() => setPickerOpen(true)}
                >
                  <Plus aria-hidden="true" className="h-5 w-5" />
                  {form.exercises.length ? "Add another exercise" : "Add your first exercise"}
                </button>
                {recentExercises.length || suggestedExerciseNames.length ? (
                  <div className="mt-4 space-y-3">
                    {suggestedExerciseNames.length ? (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-300/90">Ready to progress</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedExerciseNames.slice(0, 5).map((name) => (
                            <button
                              className="min-h-10 rounded-full border border-forge-ember/30 bg-forge-ember/[0.1] px-4 text-sm font-semibold text-orange-100 transition-colors hover:bg-forge-ember/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                              key={name}
                              type="button"
                              onClick={() => addExerciseByName(name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {recentExercises.length ? (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Recent</p>
                        <div className="flex flex-wrap gap-2">
                          {recentExercises.slice(0, 8).map((exercise) => (
                            <button
                              className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                              key={exercise.exerciseName}
                              type="button"
                              onClick={() => addExerciseByName(exercise.exerciseName)}
                            >
                              {exercise.exerciseName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <div
              className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-8 rounded-[1.75rem] border border-white/10 bg-[#0d0f13]/90 p-2 pl-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:bottom-4"
              data-tour-id="logger-save-workout"
            >
              <AnimatePresence>
                {error ? (
                  <motion.p
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden pr-3 text-sm text-red-300"
                    exit={{ opacity: 0, height: 0 }}
                    initial={{ opacity: 0, height: 0 }}
                    role="alert"
                  >
                    <span className="block pb-2 pt-1.5">{error}</span>
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm tabular-nums text-zinc-400">
                  <span className="font-bold text-white">{totals.sets}</span> {totals.sets === 1 ? "set" : "sets"}
                  <span className="hidden min-[380px]:inline"> · {formatNumber(totals.volume, 0)}kg</span>
                </p>
                {isEditMode ? (
                  <Link className="flex min-h-12 shrink-0 items-center rounded-full px-4 text-sm font-bold text-zinc-300 hover:bg-white/[0.06] hover:text-white" to={`/workouts/${id}`}>
                    Cancel
                  </Link>
                ) : null}
                <button
                  className="min-h-12 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(249,115,22,0.9)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Saving…" : isEditMode ? "Save changes" : "Save workout"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <AnimatePresence>
        {removed ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-4 bottom-[calc(10rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-sm items-center gap-3 rounded-full border border-white/10 bg-[#16181d] py-1.5 pl-5 pr-1.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] lg:bottom-24"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            role="status"
          >
            <p className="min-w-0 flex-1 truncate text-sm text-white">Removed {removed.exercise.exerciseName}</p>
            <button className="min-h-10 shrink-0 rounded-full px-4 text-sm font-bold text-orange-300 hover:bg-white/[0.06]" type="button" onClick={undoRemove}>
              Undo
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ExercisePicker
        exercises={exercises}
        open={pickerOpen}
        recentExercises={recentExercises}
        suggestions={suggestedExerciseNames}
        onClose={() => setPickerOpen(false)}
        onSelect={addExerciseObject}
      />

      {savedResult ? (
        <SessionSummary
          analysis={savedResult.analysis}
          detailsHref={savedResult.workout?._id ? `/workouts/${savedResult.workout._id}` : undefined}
          startLabel="Log another"
          title={savedResult.title}
          onStartAnother={startAnother}
        />
      ) : null}
    </Layout>
  );
};

export default WorkoutLoggerPage;
