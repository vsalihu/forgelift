import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Pause, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import Badge from "../components/ui/Badge.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import ProgressRing from "../components/visuals/ProgressRing.jsx";
import StatPill from "../components/visuals/StatPill.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { overloadService } from "../services/overloadService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";
import { workoutService } from "../services/workoutService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { helpText } from "../utils/helpText.js";
import { copySetForNext, createEmptySet, describeSetLoad, isSetValid, normalizeSetForSave } from "../utils/workoutSetUtils.js";

const restOptions = [60, 90, 120, 180];
const rpeOptions = [6, 7, 8, 9, 10];
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const emptyWorkout = () => ({
  title: "Gym Mode Workout",
  notes: "",
  sessionRPE: "",
  soreness: "",
  sleepQuality: "",
  energyLevel: "",
  startedAt: new Date().toISOString(),
  exercises: []
});

const loadInitialDraft = () => {
  const draft = localStorage.getItem("forgeliftGymModeDraft");
  if (!draft) return { workout: null, activeExerciseIndex: 0, restored: false };

  try {
    const parsed = JSON.parse(draft);
    return {
      workout: parsed.workout || parsed,
      activeExerciseIndex: parsed.activeExerciseIndex || 0,
      restored: true
    };
  } catch (_error) {
    localStorage.removeItem("forgeliftGymModeDraft");
    return { workout: null, activeExerciseIndex: 0, restored: false };
  }
};

const getTemplateWorkout = (bodyweight) => {
  const template = localStorage.getItem("forgeliftGymModeTemplate");
  if (!template) return null;

  localStorage.removeItem("forgeliftGymModeTemplate");
  const parsed = JSON.parse(template);
  return {
    title: parsed.name,
    notes: parsed.description || "",
    sessionRPE: "",
    soreness: "",
    sleepQuality: "",
    energyLevel: "",
    startedAt: new Date().toISOString(),
    exercises: parsed.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      exerciseType: exercise.exerciseType || "",
      primaryMuscles: [],
      secondaryMuscles: [],
      stabiliserMuscles: [],
      impactProfile: {},
      sets: Array.from({ length: Math.max(1, exercise.targetSets || 3) }, () =>
        createEmptySet({ exerciseType: exercise.exerciseType, bodyweight })
      )
    }))
  };
};

const ConfirmModal = ({ title, description, confirmLabel, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-md rounded-xl border border-red-400/30 bg-forge-panel p-5 shadow-2xl">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Go Back</Button>
        <Button type="button" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </div>
);

const GymModePage = () => {
  const { user } = useAuth();
  const initialDraft = useMemo(loadInitialDraft, []);
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [strengthBaselines, setStrengthBaselines] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialDraft.activeExerciseIndex);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [draftRestored, setDraftRestored] = useState(initialDraft.restored);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [savedResult, setSavedResult] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [durationTick, setDurationTick] = useState(Date.now());
  const [workout, setWorkout] = useState(() => initialDraft.workout || getTemplateWorkout(user?.bodyweight) || emptyWorkout());
  const exerciseRefs = useRef({});
  const skipDraftSaveRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [exerciseData, templateData, recentData, overloadData, baselineData] = await Promise.all([
          exerciseService.getExercises(),
          workoutTemplateService.getTemplates(),
          workoutService.getRecentExercises(),
          overloadService.getOverloadRecommendations(),
          strengthBaselineService.getStrengthBaselines()
        ]);
        setExercises(exerciseData.exercises || []);
        setTemplates(templateData.templates || []);
        setRecentExercises(recentData.exercises || []);
        setOverloadRecommendations(overloadData.recommendations || []);
        setStrengthBaselines(baselineData.baselines || []);
      } catch (err) {
        setError(err.message);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      localStorage.removeItem("forgeliftGymModeDraft");
      return;
    }
    localStorage.setItem("forgeliftGymModeDraft", JSON.stringify({ workout, activeExerciseIndex, savedAt: new Date().toISOString() }));
  }, [workout, activeExerciseIndex]);

  useEffect(() => {
    if (!timerRunning || remainingSeconds <= 0) return;
    const interval = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, remainingSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => setDurationTick(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const activeExercise = workout.exercises[activeExerciseIndex];
  const suggestedExercises = useMemo(() => overloadRecommendations.slice(0, 5).map((item) => item.exerciseName), [overloadRecommendations]);
  const timerProgress = timerSeconds ? Math.round(((timerSeconds - remainingSeconds) / timerSeconds) * 100) : 0;
  const totalLoggedSets = workout.exercises.reduce((total, exercise) => total + (exercise.sets || []).filter(isSetValid).length, 0);
  const hasValidSets = totalLoggedSets > 0;
  const durationMinutes = Math.max(0, Math.floor((durationTick - new Date(workout.startedAt || Date.now()).getTime()) / 60000));

  const scrollToExercise = (index) => {
    window.setTimeout(() => {
      exerciseRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightIndex(index);
      window.setTimeout(() => setHighlightIndex(null), 900);
    }, 50);
  };

  const focusExercise = (index, shouldScroll = true) => {
    const nextIndex = Math.max(0, Math.min(index, workout.exercises.length - 1));
    setActiveExerciseIndex(nextIndex);
    if (shouldScroll) scrollToExercise(nextIndex);
  };

  const getExerciseVolume = (exercise) =>
    (exercise.sets || []).filter(isSetValid).reduce((total, set) => {
      const normalised = normalizeSetForSave(set);
      return total + (normalised.totalLoad || 0) * (Number(normalised.reps) || 0);
    }, 0);

  const addExerciseObject = (exercise) => {
    if (!exercise) return;
    const exerciseNameValue = exercise.name || exercise.exerciseName;
    const exerciseType = exercise.exerciseType || "";
    const nextIndex = workout.exercises.length;
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          exerciseId: exercise._id || exercise.exerciseId,
          exerciseName: exerciseNameValue,
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
    });
    setActiveExerciseIndex(nextIndex);
    scrollToExercise(nextIndex);
  };

  const addExerciseByName = (exerciseName) => {
    addExerciseObject(exercises.find((item) => item.name === exerciseName) || recentExercises.find((item) => item.exerciseName === exerciseName));
  };

  const removeExercise = (indexToRemove) => {
    const nextExercises = workout.exercises.filter((_exercise, index) => index !== indexToRemove);
    setWorkout({ ...workout, exercises: nextExercises });
    const nextIndex = Math.min(indexToRemove, Math.max(0, nextExercises.length - 1));
    setActiveExerciseIndex(nextIndex);
    if (nextExercises.length) scrollToExercise(nextIndex);
  };

  const patchSet = (exerciseIndex, setIndex, patch) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) => (currentSetIndex === setIndex ? { ...set, ...patch } : set))
            }
          : exercise
      )
    });
  };

  const updateSet = (exerciseIndex, setIndex, key, value) => patchSet(exerciseIndex, setIndex, { [key]: value });

  const addSet = (exerciseIndex) => {
    const exercise = workout.exercises[exerciseIndex];
    const lastSet = exercise?.sets?.[exercise.sets.length - 1];
    if (!isSetValid(lastSet) || (exercise.exerciseType === "bodyweight" && !user?.bodyweight)) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((item, index) =>
        index === exerciseIndex ? { ...item, sets: [...item.sets, copySetForNext(lastSet)] } : item
      )
    });
  };

  const repeatLastSet = (exerciseIndex) => addSet(exerciseIndex);

  const useSuggestedWeight = (exerciseIndex) => {
    const exercise = workout.exercises[exerciseIndex];
    const baseline = strengthBaselines.find((item) => item.exerciseName === exercise?.exerciseName);
    if (!baseline || !exercise) return;
    const suggestedTotal = Number(baseline.suggestedWorkingWeight || baseline.workingWeight) || 0;
    const bodyweight = Number(user?.bodyweight) || 0;
    const addedLoad = Math.max(0, suggestedTotal - bodyweight);

    setWorkout({
      ...workout,
      exercises: workout.exercises.map((item, index) =>
        index === exerciseIndex
          ? {
              ...item,
              sets: item.sets.map((set, setIndex) =>
                setIndex === item.sets.length - 1
                  ? {
                      ...set,
                      weight: item.exerciseType === "bodyweight" && bodyweight ? bodyweight + addedLoad : String(suggestedTotal || ""),
                      totalLoad: item.exerciseType === "bodyweight" && bodyweight ? bodyweight + addedLoad : String(suggestedTotal || ""),
                      bodyweightUsed: item.exerciseType === "bodyweight" && bodyweight ? bodyweight : set.bodyweightUsed,
                      addedLoad: item.exerciseType === "bodyweight" && bodyweight ? addedLoad : set.addedLoad,
                      bodyweightOnly: item.exerciseType === "bodyweight" && bodyweight ? addedLoad === 0 : set.bodyweightOnly,
                      reps: String(baseline.reps || "")
                    }
                  : set
              )
            }
          : item
      )
    });
  };

  const applyTemplate = (template) => {
    const templateExercises = template.exercises.map((templateExercise) => {
      const libraryExercise = exercises.find(
        (exercise) => exercise._id === templateExercise.exerciseId || exercise.name === templateExercise.exerciseName
      );
      const exerciseType = libraryExercise?.exerciseType || templateExercise.exerciseType || "";
      return {
        exerciseId: templateExercise.exerciseId,
        exerciseName: templateExercise.exerciseName,
        exerciseType,
        primaryMuscles: libraryExercise?.primaryMuscles || [],
        secondaryMuscles: libraryExercise?.secondaryMuscles || [],
        stabiliserMuscles: libraryExercise?.stabiliserMuscles || [],
        mainMuscleGroups: libraryExercise?.mainMuscleGroups || [],
        detailedMuscles: libraryExercise?.detailedMuscles || [],
        impactProfile: libraryExercise?.impactProfile || {},
        sets: Array.from({ length: Math.max(1, templateExercise.targetSets || 3) }, () =>
          createEmptySet({ exerciseType, bodyweight: user?.bodyweight })
        )
      };
    });
    setWorkout({ ...workout, title: template.name, notes: template.description || "", exercises: templateExercises });
    setActiveExerciseIndex(0);
    scrollToExercise(0);
  };

  const resetWorkout = () => {
    skipDraftSaveRef.current = true;
    localStorage.removeItem("forgeliftGymModeDraft");
    setWorkout(emptyWorkout());
    setActiveExerciseIndex(0);
    setTimerSeconds(90);
    setRemainingSeconds(90);
    setTimerRunning(false);
    setSavedResult(null);
    setDraftRestored(false);
    setShowResetConfirm(false);
    setError("");
  };

  const buildPayload = () => ({
    ...workout,
    exercises: workout.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter(isSetValid).map(normalizeSetForSave)
      }))
      .filter((exercise) => exercise.sets.length)
  });

  const finishWorkout = async ({ force = false } = {}) => {
    if (!hasValidSets) return;
    const hasEmptyExercise = workout.exercises.some((exercise) => !(exercise.sets || []).some(isSetValid));
    if (hasEmptyExercise && !force) {
      setShowFinishConfirm(true);
      return;
    }
    setShowFinishConfirm(false);
    setSaving(true);
    setError("");
    try {
      const data = await workoutService.createWorkout(buildPayload());
      setSavedResult(data);
      localStorage.removeItem("forgeliftGymModeDraft");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const nextExercise = () => {
    if (!workout.exercises.length || activeExerciseIndex >= workout.exercises.length - 1) {
      setPickerOpen(true);
      return;
    }
    focusExercise(activeExerciseIndex + 1);
  };

  const currentSetValid = (exercise) =>
    isSetValid(exercise.sets?.[exercise.sets.length - 1]) && !(exercise.exerciseType === "bodyweight" && !user?.bodyweight);

  const renderSetEditor = (exercise, exerciseIndex, set, setIndex) => (
    <div className="rounded-lg bg-black/25 p-3" key={setIndex}>
      <div className="mb-3 flex flex-col gap-2 rounded-md bg-white/[0.03] p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-bold text-white">Set {setIndex + 1}: {describeSetLoad(set)} x {set.reps || 0} reps</p>
        <p className="text-slate-400">{set.rpe ? `RPE ${set.rpe}` : "RPE not set"}</p>
      </div>

      {exercise.exerciseType === "bodyweight" ? (
        <div className="mb-3 rounded-md border border-white/10 bg-black/20 p-3">
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-white">
            <input
              checked={set.bodyweightOnly !== false}
              className="h-4 w-4 accent-forge-ember"
              disabled={!user?.bodyweight}
              type="checkbox"
              onChange={(event) => {
                const checked = event.target.checked;
                const bodyweight = Number(user?.bodyweight) || 0;
                const addedLoad = checked ? 0 : Number(set.addedLoad) || 0;
                patchSet(exerciseIndex, setIndex, {
                  bodyweightOnly: checked,
                  bodyweightUsed: bodyweight || "",
                  addedLoad,
                  weight: bodyweight + addedLoad,
                  totalLoad: bodyweight + addedLoad
                });
              }}
            />
            Bodyweight only
          </label>
          {user?.bodyweight ? (
            <p className="mt-2 text-sm text-slate-300">
              {set.bodyweightOnly === false
                ? `Total load: bodyweight ${user.bodyweight}kg + added ${Number(set.addedLoad) || 0}kg = ${Number(user.bodyweight) + (Number(set.addedLoad) || 0)}kg`
                : `Using profile bodyweight: ${user.bodyweight}kg`}
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
              <span>Add bodyweight in Profile to use bodyweight-only logging.</span>
              <Link className="font-bold text-red-100 underline" to="/profile">Update Profile</Link>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {exercise.exerciseType === "bodyweight" ? (
          set.bodyweightOnly === false ? (
            <FormInput
              label="Added load"
              min="0"
              type="number"
              value={set.addedLoad || ""}
              onChange={(event) => {
                const added = Number(event.target.value) || 0;
                const bodyweight = Number(user?.bodyweight) || 0;
                patchSet(exerciseIndex, setIndex, {
                  addedLoad: event.target.value,
                  bodyweightUsed: bodyweight || "",
                  weight: bodyweight + added,
                  totalLoad: bodyweight + added
                });
              }}
            />
          ) : (
            <div className="rounded-md bg-white/5 p-3 text-sm text-slate-300">
              <p className="text-slate-500">Load</p>
              <p className="font-bold text-white">{describeSetLoad(set)}</p>
            </div>
          )
        ) : (
          <FormInput label="kg" min="0" type="number" value={set.weight} onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)} />
        )}
        <FormInput label="reps" min="1" type="number" value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)} />
        <FormInput label={<span className="inline-flex items-center gap-1">RPE <HelpTooltip {...helpText.rpe} size="xs" /></span>} max="10" min="1" type="number" value={set.rpe} onChange={(event) => updateSet(exerciseIndex, setIndex, "rpe", event.target.value)} />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {rpeOptions.map((rpe) => (
          <button
            className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-black transition ${
              Number(set.rpe) === rpe ? "bg-forge-ember text-white" : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
            key={rpe}
            type="button"
            onClick={() => updateSet(exerciseIndex, setIndex, "rpe", String(rpe))}
          >
            RPE {rpe}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Layout>
      <ExercisePicker
        open={pickerOpen}
        exercises={exercises}
        recentExercises={recentExercises}
        suggestions={suggestedExercises}
        onClose={() => setPickerOpen(false)}
        onSelect={addExerciseObject}
      />
      {showResetConfirm ? (
        <ConfirmModal
          title="Reset Gym Mode workout?"
          description="This will clear the current unsaved Gym Mode workout. Saved workouts will not be affected."
          confirmLabel="Reset Workout"
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={resetWorkout}
        />
      ) : null}
      {showFinishConfirm ? (
        <ConfirmModal
          title="Finish workout anyway?"
          description="Some exercises have no logged sets. ForgeLift will save the exercises with valid sets and ignore empty exercise cards."
          confirmLabel="Finish"
          onCancel={() => setShowFinishConfirm(false)}
          onConfirm={() => finishWorkout({ force: true })}
        />
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      {draftRestored ? (
        <section className="mb-5 rounded-xl border border-forge-copper/30 bg-forge-copper/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-orange-100">Workout draft restored.</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setDraftRestored(false)}>Continue</Button>
              <Button type="button" variant="danger" onClick={() => setShowResetConfirm(true)}>Reset</Button>
            </div>
          </div>
        </section>
      ) : null}

      {user?.beginnerTipsEnabled !== false ? (
        <BeginnerTip title="Gym Mode tip">
          Add all exercises for the session, tap any exercise card to make it current, then use Next Exercise to move through the list.
        </BeginnerTip>
      ) : null}

      {savedResult?.analysis ? (
        <section className="metal-panel mb-6 rounded-lg border-forge-copper/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Workout saved</p>
              <h2 className="mt-2 text-2xl font-black text-white">Analysis summary</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={resetWorkout}>Start New Workout</Button>
              <Link className="inline-flex min-h-11 items-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white" to="/workouts">
                View Workout History
              </Link>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md bg-black/25 p-4"><p className="text-sm text-slate-400">Volume</p><p className="text-xl font-black text-white">{formatNumber(savedResult.analysis.totalVolume)}kg</p></div>
            <div className="rounded-md bg-black/25 p-4"><p className="text-sm text-slate-400">XP</p><p className="text-xl font-black text-white">+{savedResult.analysis.xpEarned || 0}</p></div>
            <div className="rounded-md bg-black/25 p-4"><p className="text-sm text-slate-400">PRs</p><p className="text-xl font-black text-white">{savedResult.analysis.newPersonalRecords?.length || 0}</p></div>
            <div className="rounded-md bg-black/25 p-4"><p className="text-sm text-slate-400">Missions</p><p className="text-xl font-black text-white">{savedResult.analysis.newlyCompletedMissions?.length || 0}</p></div>
          </div>
          <details className="mt-4 rounded-md bg-black/20 p-4 text-sm text-slate-300" open>
            <summary className="cursor-pointer font-bold text-white">Summary</summary>
            <div className="mt-3 space-y-2">
              {savedResult.analysis.summaryMessages?.slice(0, 5).map((message) => <p key={message}>{message}</p>)}
              {savedResult.analysis.overloadRecommendations?.[0] ? <p>Overload: {savedResult.analysis.overloadRecommendations[0].exerciseName} - {savedResult.analysis.overloadRecommendations[0].reason}</p> : null}
              {savedResult.analysis.deloadSummary?.[0] ? <p className="text-orange-200">Warning: {savedResult.analysis.deloadSummary[0].reason}</p> : null}
            </div>
          </details>
        </section>
      ) : null}

      <section className="metal-panel mb-5 rounded-xl p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label="Workout title" value={workout.title} onChange={(event) => setWorkout({ ...workout, title: event.target.value })} />
            <FormInput label="Notes" value={workout.notes} onChange={(event) => setWorkout({ ...workout, notes: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            <div className="rounded-lg bg-black/25 p-3 text-center"><p className="text-xs text-slate-400">Duration</p><p className="font-black text-white">{durationMinutes}m</p></div>
            <div className="rounded-lg bg-black/25 p-3 text-center"><p className="text-xs text-slate-400">Exercises</p><p className="font-black text-white">{workout.exercises.length}</p></div>
            <div className="rounded-lg bg-black/25 p-3 text-center"><p className="text-xs text-slate-400">Sets</p><p className="font-black text-white">{totalLoggedSets}</p></div>
            <Button type="button" variant="danger" onClick={() => setShowResetConfirm(true)}>Reset</Button>
          </div>
        </div>
      </section>

      {!workout.exercises.length ? (
        <section className="metal-panel rounded-xl p-6">
          <EmptyState title="Ready to start?" description="Add your first exercise or start from a workout template." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" />Add Exercise</Button>
            {templates[0] ? <Button type="button" variant="secondary" onClick={() => applyTemplate(templates[0])}>Use Template</Button> : null}
          </div>
          <div className="mt-6 space-y-4">
            {templates.length ? (
              <div>
                <p className="mb-2 text-sm font-bold text-slate-300">Templates</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templates.slice(0, 6).map((template) => (
                    <button className="min-h-11 shrink-0 rounded-md bg-white/10 px-3 text-sm font-semibold text-white" key={template._id} type="button" onClick={() => applyTemplate(template)}>
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {recentExercises.length ? (
              <div>
                <p className="mb-2 text-sm font-bold text-slate-300">Recent exercises</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recentExercises.slice(0, 8).map((exercise) => (
                    <button className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200" key={exercise.exerciseName} type="button" onClick={() => addExerciseByName(exercise.exerciseName)}>
                      {exercise.exerciseName}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {suggestedExercises.length ? (
              <div>
                <p className="mb-2 text-sm font-bold text-slate-300">Smart Overload targets</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {suggestedExercises.map((exerciseName) => (
                    <button className="shrink-0 rounded-full bg-forge-ember/15 px-3 py-2 text-sm font-semibold text-orange-200" key={exerciseName} type="button" onClick={() => addExerciseByName(exerciseName)}>
                      {exerciseName}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Exercise List</p>
              <h1 className="mt-1 text-2xl font-black text-white">Live workout</h1>
            </div>
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" />Add Exercise</Button>
          </div>

          {workout.exercises.map((exercise, exerciseIndex) => {
            const isActive = exerciseIndex === activeExerciseIndex;
            const recommendation = overloadRecommendations.find((item) => item.exerciseName === exercise.exerciseName);
            const baseline = strengthBaselines.find((item) => item.exerciseName === exercise.exerciseName);
            const validSets = (exercise.sets || []).filter(isSetValid);
            const lastSet = exercise.sets?.[exercise.sets.length - 1];

            return (
              <article
                className={`rounded-xl border p-4 transition ${
                  isActive
                    ? "border-forge-copper/70 bg-forge-copper/10 shadow-metal"
                    : "border-white/10 bg-black/20"
                } ${highlightIndex === exerciseIndex ? "ring-2 ring-forge-ember/70" : ""}`}
                key={`${exercise.exerciseName}-${exerciseIndex}`}
                ref={(node) => {
                  exerciseRefs.current[exerciseIndex] = node;
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button className="text-left" type="button" onClick={() => focusExercise(exerciseIndex)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-white">{exercise.exerciseName}</h2>
                      {isActive ? <Badge tone="orange">Current</Badge> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(exercise.primaryMuscles || []).slice(0, 4).map((muscle) => (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-slate-200" key={muscle}>{muscle}</span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {validSets.length ? `${validSets.length} sets logged` : "No sets yet"} • {formatNumber(getExerciseVolume(exercise))}kg volume
                    </p>
                  </button>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => focusExercise(exerciseIndex)}>
                      {isActive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isActive ? "Open" : "Open"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => removeExercise(exerciseIndex)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                {isActive ? (
                  <div className="mt-4 space-y-4">
                    {Object.keys(exercise.impactProfile || {}).length ? (
                      <div className="rounded-lg bg-black/20 p-3">
                        <p className="mb-2 text-sm font-bold text-white">Muscle impact</p>
                        <div className="space-y-2">
                          {Object.entries(exercise.impactProfile).slice(0, 5).map(([muscle, value]) => (
                            <div key={muscle}>
                              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>{muscle}</span><span>{value}%</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-forge-ember" style={{ width: `${Math.min(100, value)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {recommendation ? <p className="rounded-md bg-forge-ember/10 p-3 text-sm text-orange-100">Smart Overload <HelpTooltip {...helpText.smartOverload} size="xs" />: {recommendation.reason}</p> : null}
                    {baseline ? (
                      <div className="rounded-md bg-white/5 p-3 text-sm text-slate-300">
                        <p className="font-semibold text-white">
                          Suggested starting weight <HelpTooltip {...helpText.strengthBaseline} size="xs" />: {formatNumber(baseline.suggestedWorkingWeight || baseline.workingWeight)}kg for{" "}
                          {baseline.suggestedRepRange || `${baseline.reps} reps`}
                        </p>
                        <button className="mt-2 text-sm font-semibold text-forge-ember hover:text-orange-300" type="button" onClick={() => useSuggestedWeight(exerciseIndex)}>
                          Use suggested weight
                        </button>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {exercise.sets.map((set, setIndex) => renderSetEditor(exercise, exerciseIndex, set, setIndex))}
                    </div>
                    {!currentSetValid(exercise) ? (
                      <p className="text-sm text-slate-400">
                        {exercise.exerciseType === "bodyweight"
                          ? user?.bodyweight
                            ? "Enter reps to unlock Add Set."
                            : "Add your bodyweight in Profile to unlock bodyweight logging."
                          : "Enter weight and reps to unlock Add Set."}
                      </p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="min-h-12" disabled={!currentSetValid(exercise)} type="button" onClick={() => addSet(exerciseIndex)}>Add Set</Button>
                      <Button className="min-h-12" disabled={!currentSetValid(exercise)} type="button" variant="secondary" onClick={() => repeatLastSet(exerciseIndex)}>Repeat Last Set</Button>
                      <Button type="button" variant="secondary" onClick={() => focusExercise(Math.max(0, exerciseIndex - 1))}>Previous</Button>
                      <Button type="button" variant="secondary" onClick={nextExercise}>Next Exercise</Button>
                    </div>
                    {lastSet ? <p className="text-xs text-slate-500">Current input: {describeSetLoad(lastSet)} x {lastSet.reps || 0} reps.</p> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      <section className="metal-panel mt-5 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <ProgressRing label="Rest" size={96} sublabel={remainingSeconds <= 10 ? "Ready" : "Timer"} value={timerProgress} variant={remainingSeconds <= 10 ? "success" : "info"} />
          <div>
            <p className="text-sm text-slate-400">Rest timer <HelpTooltip {...helpText.restTimer} size="xs" /></p>
            <p className="text-3xl font-black text-white">{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}</p>
            <div className="mt-2"><StatPill variant={timerRunning ? "info" : "neutral"}>{timerRunning ? "Running" : "Paused"}</StatPill></div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
            <Button type="button" variant="ghost" onClick={() => { setRemainingSeconds(timerSeconds); setTimerRunning(false); }}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {restOptions.map((seconds) => (
            <button className={`rounded-md px-3 py-2 text-sm font-semibold ${timerSeconds === seconds ? "bg-forge-ember text-white" : "bg-white/10 text-slate-200"}`} key={seconds} type="button" onClick={() => { setTimerSeconds(seconds); setRemainingSeconds(seconds); }}>
              {seconds}s
            </button>
          ))}
        </div>
      </section>

      <div className="sticky bottom-20 z-20 mt-5 rounded-t-xl bg-forge-black/95 p-2 pb-3 backdrop-blur lg:bottom-4 lg:rounded-xl">
        <div className="grid grid-cols-3 gap-2">
          <Button className="min-h-12" type="button" variant="secondary" onClick={() => setPickerOpen(true)}>Add Exercise</Button>
          <Button className="min-h-12" disabled={!workout.exercises.length} type="button" variant="secondary" onClick={() => focusExercise(activeExerciseIndex)}>Current Exercise</Button>
          <Button className="min-h-12 shadow-metal" disabled={!hasValidSets} loading={saving} type="button" onClick={() => finishWorkout()}>
            <Save className="h-4 w-4" />
            Finish
          </Button>
        </div>
        {!hasValidSets ? <p className="mt-2 text-center text-xs text-slate-400">Log at least one set before finishing.</p> : null}
      </div>
    </Layout>
  );
};

export default GymModePage;
