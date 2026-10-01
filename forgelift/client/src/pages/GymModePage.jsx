import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BottomSheet from "../components/ui/BottomSheet.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import CoopSessionBanner from "../components/coop/CoopSessionBanner.jsx";
import GuidedTutorial from "../components/tutorial/GuidedTutorial.jsx";
import ExerciseStrip from "../components/gym/ExerciseStrip.jsx";
import FocusExercise from "../components/gym/FocusExercise.jsx";
import GymDialog from "../components/gym/GymDialog.jsx";
import GymMenu from "../components/gym/GymMenu.jsx";
import GymStart from "../components/gym/GymStart.jsx";
import RestDock, { REST_PRESETS, restRemaining } from "../components/gym/RestDock.jsx";
import SessionClock from "../components/gym/SessionClock.jsx";
import SessionSummary from "../components/gym/SessionSummary.jsx";
import { exerciseSuggestion, exerciseVolume, isBodyweightExercise, isLogged, setPlaceholder } from "../components/gym/gymUtils.js";
import { useAuth } from "../hooks/useAuth.js";
import { activityService } from "../services/activityService.js";
import { coopSessionService } from "../services/coopSessionService.js";
import { exerciseService } from "../services/exerciseService.js";
import { overloadService } from "../services/overloadService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";
import { workoutService } from "../services/workoutService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { createEmptySet, isSetValid, normalizeSetForSave } from "../utils/workoutSetUtils.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const DRAFT_KEY = "forgeliftGymModeDraft";
const TEMPLATE_KEY = "forgeliftGymModeTemplate";
const REST_KEY = "forgeliftRestSeconds";
const EASE = [0.16, 1, 0.3, 1];

const defaultTitle = () => `${new Date().toLocaleDateString("en-US", { weekday: "long" })} workout`;

const emptyWorkout = () => ({
  title: defaultTitle(),
  notes: "",
  sessionRPE: "",
  soreness: "",
  sleepQuality: "",
  energyLevel: "",
  startedAt: new Date().toISOString(),
  exercises: []
});

const newSet = (exerciseType, bodyweight, like) => ({
  ...createEmptySet({ exerciseType, bodyweight }),
  ...(like && exerciseType === "bodyweight" ? { bodyweightOnly: like.bodyweightOnly, addedLoad: like.bodyweightOnly === false ? "" : 0 } : {}),
  done: false
});

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (_error) {
    // Storage can be unavailable in private windows; Gym Mode still works without it.
  }
};

const loadInitialDraft = () => {
  const draft = readStorage(DRAFT_KEY);
  if (!draft) return { workout: null, activeExerciseIndex: 0, restored: false };

  try {
    const parsed = JSON.parse(draft);
    const workout = parsed.workout || parsed;
    return {
      workout,
      activeExerciseIndex: parsed.activeExerciseIndex || 0,
      restored: Boolean(workout?.exercises?.length)
    };
  } catch (_error) {
    writeStorage(DRAFT_KEY, null);
    return { workout: null, activeExerciseIndex: 0, restored: false };
  }
};

const getTemplateWorkout = (bodyweight) => {
  // Read only; the page clears the key after mounting so a second render still sees it.
  const template = readStorage(TEMPLATE_KEY);
  if (!template) return null;

  try {
    const parsed = JSON.parse(template);
    return {
      ...emptyWorkout(),
      title: parsed.name,
      notes: parsed.description || "",
      exercises: parsed.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        exerciseType: exercise.exerciseType || "",
        primaryMuscles: exercise.primaryMuscles || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        stabiliserMuscles: exercise.stabiliserMuscles || [],
        mainMuscleGroups: exercise.mainMuscleGroups || [],
        impactProfile: {},
        sets: Array.from({ length: Math.max(1, exercise.targetSets || 3) }, () => newSet(exercise.exerciseType, bodyweight))
      }))
    };
  } catch (_error) {
    return null;
  }
};

const initialRestSeconds = () => {
  const stored = Number(readStorage(REST_KEY));
  return REST_PRESETS.includes(stored) ? stored : 90;
};

const GymModePage = () => {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const bodyweight = Number(user?.bodyweight) || 0;
  // A workout handed over from elsewhere (template, repeat) wins over an old draft.
  const initialDraft = useMemo(() => {
    const template = getTemplateWorkout(user?.bodyweight);
    return template ? { workout: template, activeExerciseIndex: 0, restored: false } : loadInitialDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [strengthBaselines, setStrengthBaselines] = useState([]);
  const [inboxWorkouts, setInboxWorkouts] = useState([]);
  const [activeCoopSession, setActiveCoopSession] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workoutPickerOpen, setWorkoutPickerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialDraft.activeExerciseIndex);
  const [direction, setDirection] = useState(1);
  const [draftRestored, setDraftRestored] = useState(initialDraft.restored);
  const [savedResult, setSavedResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [restSeconds, setRestSeconds] = useState(initialRestSeconds);
  const [rest, setRest] = useState(null);
  const [invalidSet, setInvalidSet] = useState(null);
  const [rpeSet, setRpeSet] = useState(null);
  const [tourToken, setTourToken] = useState(0);
  const [workout, setWorkout] = useState(() => initialDraft.workout || emptyWorkout());
  const skipDraftSaveRef = useRef(false);

  useEffect(() => {
    writeStorage(TEMPLATE_KEY, null);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [exerciseData, templateData, recentData, overloadData, baselineData, inboxData, coopData] = await Promise.all([
          exerciseService.getExercises(),
          workoutTemplateService.getTemplates(),
          workoutService.getRecentExercises(),
          overloadService.getOverloadRecommendations(),
          strengthBaselineService.getStrengthBaselines(),
          activityService.getInbox(),
          coopSessionService.getActive()
        ]);
        setExercises(exerciseData.exercises || []);
        setTemplates(templateData.templates || []);
        setRecentExercises(recentData.exercises || []);
        setOverloadRecommendations(overloadData.recommendations || []);
        setStrengthBaselines(baselineData.baselines || []);
        setInboxWorkouts(inboxData.inbox || []);
        setActiveCoopSession(coopData.session || null);
      } catch (err) {
        setError(err.message);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      writeStorage(DRAFT_KEY, null);
      return;
    }
    if (savedResult) return;
    writeStorage(DRAFT_KEY, JSON.stringify({ workout, activeExerciseIndex, savedAt: new Date().toISOString() }));
  }, [workout, activeExerciseIndex, savedResult]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const exerciseCount = workout.exercises.length;
  const safeIndex = Math.min(activeExerciseIndex, Math.max(0, exerciseCount - 1));
  const activeExercise = workout.exercises[safeIndex];
  const allSets = workout.exercises.flatMap((exercise) => exercise.sets || []);
  const loggedCount = allSets.filter(isLogged).length;
  const untickedCount = allSets.filter((set) => set.done === false && isSetValid(set)).length;
  const suggestedExercises = useMemo(() => overloadRecommendations.slice(0, 5).map((item) => item.exerciseName), [overloadRecommendations]);

  const historyFor = useCallback((name) => recentExercises.find((item) => item.exerciseName === name), [recentExercises]);

  useEffect(() => {
    if (!activeCoopSession?._id) return undefined;

    const timeout = window.setTimeout(() => {
      coopSessionService
        .updateProgress(activeCoopSession._id, {
          completedSets: loggedCount,
          totalVolume: workout.exercises.reduce((total, exercise) => total + exerciseVolume(exercise), 0),
          currentExerciseName: activeExercise?.exerciseName || ""
        })
        .catch(() => {});
    }, 1500);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, safeIndex, activeCoopSession?._id]);

  const goTo = (index) => {
    const next = Math.max(0, Math.min(index, exerciseCount - 1));
    setDirection(next >= safeIndex ? 1 : -1);
    setActiveExerciseIndex(next);
    setInvalidSet(null);
    setRpeSet(null);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  // The clock starts with the first exercise, not when the page opens.
  const startClockIfEmpty = (current) => (current.exercises.length ? current.startedAt : new Date().toISOString());

  const addExerciseObject = (exercise) => {
    if (!exercise) return;
    const exerciseType = exercise.exerciseType || "";
    const nextIndex = workout.exercises.length;
    setWorkout({
      ...workout,
      startedAt: startClockIfEmpty(workout),
      exercises: [
        ...workout.exercises,
        {
          exerciseId: exercise._id || exercise.exerciseId,
          exerciseName: exercise.name || exercise.exerciseName,
          exerciseType,
          mainMuscleGroups: exercise.mainMuscleGroups || [],
          detailedMuscles: exercise.detailedMuscles || [],
          primaryMuscles: exercise.primaryMuscles || [],
          secondaryMuscles: exercise.secondaryMuscles || [],
          stabiliserMuscles: exercise.stabiliserMuscles || [],
          impactProfile: exercise.impactProfile || {},
          sets: [newSet(exerciseType, user?.bodyweight), newSet(exerciseType, user?.bodyweight), newSet(exerciseType, user?.bodyweight)]
        }
      ]
    });
    setDirection(1);
    setActiveExerciseIndex(nextIndex);
    setInvalidSet(null);
    setRpeSet(null);
  };

  const addExerciseByName = (exerciseName) => {
    addExerciseObject(exercises.find((item) => item.name === exerciseName) || recentExercises.find((item) => item.exerciseName === exerciseName));
  };

  const removeExercise = (indexToRemove) => {
    const nextExercises = workout.exercises.filter((_exercise, index) => index !== indexToRemove);
    setWorkout({ ...workout, exercises: nextExercises });
    setActiveExerciseIndex(Math.min(indexToRemove, Math.max(0, nextExercises.length - 1)));
    setInvalidSet(null);
    setRpeSet(null);
    setDialog(null);
  };

  const confirmRemoveExercise = () => {
    if (!activeExercise) return;
    if (!activeExercise.sets.some(isLogged)) {
      removeExercise(safeIndex);
      return;
    }
    setDialog({
      title: `Remove ${activeExercise.exerciseName}?`,
      description: "The sets you ticked for this exercise will be removed from this workout.",
      actions: [
        { label: "Keep it", onClick: () => setDialog(null) },
        { label: "Remove", tone: "danger", onClick: () => removeExercise(safeIndex) }
      ]
    });
  };

  const updateActiveSets = (mapSets) => {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => (index === safeIndex ? { ...exercise, sets: mapSets(exercise.sets, exercise) } : exercise))
    }));
  };

  const patchSet = (setIndex, patch) => updateActiveSets((sets) => sets.map((set, index) => (index === setIndex ? { ...set, ...patch } : set)));

  const handleSetChange = (setIndex, field, value) => {
    if (invalidSet === setIndex) setInvalidSet(null);
    if (field === "addedLoad") {
      const added = Number(value) || 0;
      patchSet(setIndex, { addedLoad: value, bodyweightUsed: bodyweight || "", weight: bodyweight + added, totalLoad: bodyweight + added });
      return;
    }
    patchSet(setIndex, { [field]: value });
  };

  const startRest = (seconds = restSeconds) => setRest({ duration: seconds, endsAt: Date.now() + seconds * 1000, paused: false });

  const toggleDone = (setIndex) => {
    const exercise = activeExercise;
    const set = exercise?.sets[setIndex];
    if (!set) return;

    if (set.done) {
      patchSet(setIndex, { done: false });
      if (rpeSet === setIndex) setRpeSet(null);
      return;
    }

    // Empty fields take the ghost values shown in them.
    const ghost = setPlaceholder(exercise, setIndex, historyFor(exercise.exerciseName));
    let filled = { ...set, reps: set.reps || ghost.reps };
    if (isBodyweightExercise(exercise)) {
      if (!bodyweight) {
        setInvalidSet(setIndex);
        return;
      }
      const weighted = set.bodyweightOnly === false;
      const addedRaw = weighted ? (Number(set.addedLoad) ? set.addedLoad : ghost.addedLoad && Number(ghost.addedLoad) ? ghost.addedLoad : 0) : 0;
      const added = Number(addedRaw) || 0;
      filled = { ...filled, addedLoad: weighted ? addedRaw : 0, bodyweightUsed: bodyweight, weight: bodyweight + added, totalLoad: bodyweight + added };
    } else {
      filled = { ...filled, weight: set.weight || ghost.weight };
    }

    if (!isSetValid(filled)) {
      setInvalidSet(setIndex);
      return;
    }

    patchSet(setIndex, { ...filled, done: true });
    setInvalidSet(null);
    setRpeSet(setIndex);
    startRest();
  };

  const addSet = () => {
    updateActiveSets((sets, exercise) => [...sets, newSet(exercise.exerciseType, user?.bodyweight, sets[sets.length - 1])]);
  };

  const removeLastSet = () => {
    updateActiveSets((sets) => (sets.length > 1 ? sets.slice(0, -1) : sets));
    setInvalidSet(null);
    setRpeSet(null);
  };

  const setBodyweightMode = (weighted) => {
    updateActiveSets((sets) =>
      sets.map((set) =>
        set.done
          ? set
          : {
              ...set,
              bodyweightOnly: !weighted,
              bodyweightUsed: bodyweight || null,
              addedLoad: weighted ? "" : 0,
              weight: bodyweight ? String(bodyweight) : "",
              totalLoad: bodyweight || ""
            }
      )
    );
  };

  const activeSuggestion = activeExercise
    ? exerciseSuggestion(
        overloadRecommendations.find((item) => item.exerciseName === activeExercise.exerciseName),
        strengthBaselines.find((item) => item.exerciseName === activeExercise.exerciseName)
      )
    : null;

  // Fills every set not yet ticked with the suggestion.
  const useSuggestion = () => {
    if (!activeSuggestion) return;
    const total = Number(activeSuggestion.weight) || 0;
    updateActiveSets((sets, exercise) =>
      sets.map((set) => {
        if (set.done) return set;
        const reps = activeSuggestion.reps || set.reps;
        if (isBodyweightExercise(exercise) && bodyweight) {
          const added = Math.max(0, total - bodyweight);
          return { ...set, reps, bodyweightUsed: bodyweight, addedLoad: added, bodyweightOnly: added === 0, weight: bodyweight + added, totalLoad: bodyweight + added };
        }
        return { ...set, reps, weight: String(total || "") };
      })
    );
    setInvalidSet(null);
  };

  const applyTemplate = (template) => {
    const templateExercises = template.exercises.map((templateExercise) => {
      const libraryExercise = exercises.find((exercise) => exercise._id === templateExercise.exerciseId || exercise.name === templateExercise.exerciseName);
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
        sets: Array.from({ length: Math.max(1, templateExercise.targetSets || 3) }, () => newSet(exerciseType, user?.bodyweight))
      };
    });
    setWorkout({ ...workout, startedAt: startClockIfEmpty(workout), title: template.name, notes: template.description || "", exercises: templateExercises });
    setDirection(1);
    setActiveExerciseIndex(0);
    setDraftRestored(false);
  };

  const loadFromWorkoutPicker = (item) => {
    applyTemplate({
      name: item.name || item.workoutName,
      description: item.description || item.workoutDescription,
      exercises: item.exercises
    });
    setWorkoutPickerOpen(false);
  };

  const resetWorkout = () => {
    skipDraftSaveRef.current = true;
    writeStorage(DRAFT_KEY, null);
    setWorkout(emptyWorkout());
    setActiveExerciseIndex(0);
    setRest(null);
    setSavedResult(null);
    setDraftRestored(false);
    setDialog(null);
    setInvalidSet(null);
    setRpeSet(null);
    setError("");
  };

  const confirmReset = () =>
    setDialog({
      title: "Reset this workout?",
      description: "This clears the workout in progress on this device. Saved workouts are not affected.",
      actions: [
        { label: "Keep going", onClick: () => setDialog(null) },
        { label: "Reset", tone: "danger", onClick: resetWorkout }
      ]
    });

  const buildPayload = (source) => ({
    ...source,
    exercises: source.exercises
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.filter(isLogged).map(({ done: _done, ...set }) => normalizeSetForSave(set))
      }))
      .filter((exercise) => exercise.sets.length)
  });

  const saveWorkout = async (source) => {
    setDialog(null);
    setSaving(true);
    setError("");
    try {
      const data = await workoutService.createWorkout(buildPayload(source));
      writeStorage(DRAFT_KEY, null);
      setRest(null);
      setSavedResult({ ...data, finishedAt: Date.now(), title: source.title, startedAt: source.startedAt });

      if (activeCoopSession?._id) {
        coopSessionService.finish(activeCoopSession._id, data.workout._id).catch(() => {});
        setActiveCoopSession(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const finishWorkout = () => {
    if (saving) return;
    if (!loggedCount && !untickedCount) {
      setNotice("Tick at least one set before finishing.");
      return;
    }
    if (untickedCount) {
      const markAll = {
        ...workout,
        exercises: workout.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => (set.done === false && isSetValid(set) ? { ...set, done: true } : set))
        }))
      };
      setDialog({
        title: `${untickedCount} ${untickedCount === 1 ? "set isn't" : "sets aren't"} ticked`,
        description: loggedCount
          ? "Ticked sets are saved. Count the filled-in sets too, or leave them out?"
          : "Nothing is ticked yet. Count the sets you filled in?",
        actions: [
          { label: "Go back", onClick: () => setDialog(null) },
          ...(loggedCount ? [{ label: "Leave them out", onClick: () => saveWorkout(workout) }] : []),
          {
            label: "Count them",
            tone: "primary",
            onClick: () => {
              setWorkout(markAll);
              saveWorkout(markAll);
            }
          }
        ]
      });
      return;
    }
    saveWorkout(workout);
  };

  const nextExercise = () => {
    if (safeIndex >= exerciseCount - 1) {
      setPickerOpen(true);
      return;
    }
    goTo(safeIndex + 1);
  };

  const nextLabel = (() => {
    if (!activeExercise) return "";
    const nextSetIndex = activeExercise.sets.findIndex((set) => !set.done);
    if (nextSetIndex >= 0) return `Next: set ${nextSetIndex + 1} · ${activeExercise.exerciseName}`;
    const upcoming = workout.exercises[safeIndex + 1];
    return upcoming ? `Next: ${upcoming.exerciseName}` : "Last set done. Finish when ready.";
  })();

  const adjustRest = (delta) =>
    setRest((current) => {
      if (!current) return current;
      if (current.paused) return { ...current, remaining: Math.max(0, current.remaining + delta), duration: Math.max(1, current.duration + delta) };
      return { ...current, endsAt: Math.max(Date.now(), current.endsAt + delta * 1000), duration: Math.max(1, current.duration + delta) };
    });

  const toggleRestPause = () =>
    setRest((current) => {
      if (!current) return current;
      if (current.paused) return { ...current, paused: false, endsAt: Date.now() + current.remaining * 1000 };
      return { ...current, paused: true, remaining: restRemaining(current) };
    });

  const choosePreset = (seconds) => {
    setRestSeconds(seconds);
    writeStorage(REST_KEY, String(seconds));
  };

  const slide = reduce
    ? {}
    : {
        initial: { opacity: 0, x: direction * 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -40 },
        transition: { duration: 0.35, ease: EASE }
      };

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-[#07080a]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(70%_80%_at_50%_-10%,rgba(249,115,22,0.16),transparent_70%)]" />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080a]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-1.5 sm:gap-2">
            <Link
              aria-label="Leave Gym Mode. Your workout stays saved on this device."
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              to="/dashboard"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <input
                aria-label="Workout name"
                className="block w-full truncate rounded-md bg-transparent text-base font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:text-lg"
                maxLength={80}
                value={workout.title}
                onChange={(event) => setWorkout({ ...workout, title: event.target.value })}
              />
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                {exerciseCount ? (
                  <>
                    <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forge-ember opacity-60 motion-reduce:hidden" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forge-ember" />
                    </span>
                    <SessionClock className="font-semibold text-zinc-300" startedAt={workout.startedAt} />
                    <span>· {loggedCount} {loggedCount === 1 ? "set" : "sets"}</span>
                  </>
                ) : (
                  "Gym Mode"
                )}
              </p>
            </div>
            <GymMenu onLoad={() => setWorkoutPickerOpen(true)} onNotes={() => setNotesOpen(true)} onReset={confirmReset} onTour={() => setTourToken((value) => value + 1)} />
            <button
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-[background-color,box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.97] sm:px-5 ${
                loggedCount
                  ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(249,115,22,0.9)]"
                  : "border border-white/12 bg-white/[0.05] text-zinc-300"
              }`}
              data-tour-id="gym-finish-workout"
              type="button"
              onClick={finishWorkout}
            >
              {saving ? "Saving…" : "Finish"}
            </button>
          </div>
          {exerciseCount ? (
            <div className="pb-3">
              <ExerciseStrip activeIndex={safeIndex} exercises={workout.exercises} onAdd={() => setPickerOpen(true)} onSelect={goTo} />
            </div>
          ) : null}
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 sm:px-6" id="main-content">
        {error ? (
          <p className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
            {error}
          </p>
        ) : null}

        {activeCoopSession?._id ? <CoopSessionBanner sessionId={activeCoopSession._id} /> : null}

        <AnimatePresence>
          {draftRestored && exerciseCount ? (
            <motion.div
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
              exit={{ opacity: 0, height: 0 }}
              initial={false}
            >
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-forge-copper/30 bg-forge-copper/[0.08] py-2 pl-4 pr-2">
                <p className="min-w-0 flex-1 text-sm text-orange-100">Picked up where you left off.</p>
                <button className="min-h-10 shrink-0 rounded-full px-3 text-sm font-bold text-orange-200 hover:bg-white/[0.06]" type="button" onClick={confirmReset}>
                  Start fresh
                </button>
                <button
                  aria-label="Dismiss"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-orange-200/70 hover:bg-white/[0.06] hover:text-orange-100"
                  type="button"
                  onClick={() => setDraftRestored(false)}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {activeExercise ? (
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div key={`${safeIndex}-${activeExercise.exerciseName}`} {...slide}>
              <FocusExercise
                bodyweight={bodyweight}
                exercise={activeExercise}
                history={historyFor(activeExercise.exerciseName)}
                index={safeIndex}
                invalidSet={invalidSet}
                rpeSet={rpeSet}
                suggestion={activeSuggestion}
                total={exerciseCount}
                onAddSet={addSet}
                onBodyweightMode={setBodyweightMode}
                onNext={nextExercise}
                onPrev={() => goTo(safeIndex - 1)}
                onRemoveExercise={confirmRemoveExercise}
                onRemoveLastSet={removeLastSet}
                onRpe={(setIndex, value) => {
                  patchSet(setIndex, { rpe: value });
                  setRpeSet(null);
                }}
                onSetChange={handleSetChange}
                onToggleDone={toggleDone}
                onToggleRpe={(setIndex) => setRpeSet((current) => (current === setIndex ? null : setIndex))}
                onUseSuggestion={useSuggestion}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <GymStart
            inbox={inboxWorkouts}
            recent={recentExercises}
            targets={suggestedExercises}
            templates={templates}
            onAdd={() => setPickerOpen(true)}
            onInbox={loadFromWorkoutPicker}
            onLoadPicker={() => setWorkoutPickerOpen(true)}
            onQuickAdd={addExerciseByName}
            onTemplate={applyTemplate}
          />
        )}
      </main>

      <AnimatePresence>
        {notice ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-full border border-white/10 bg-[#16181d] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            role="status"
          >
            {notice}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <RestDock
        defaultSeconds={restSeconds}
        nextLabel={nextLabel}
        rest={rest}
        onAdjust={adjustRest}
        onPreset={choosePreset}
        onSkip={() => setRest(null)}
        onStart={() => startRest()}
        onTogglePause={toggleRestPause}
      />

      <ExercisePicker
        exercises={exercises}
        open={pickerOpen}
        recentExercises={recentExercises}
        suggestions={suggestedExercises}
        onClose={() => setPickerOpen(false)}
        onSelect={addExerciseObject}
      />

      <BottomSheet open={workoutPickerOpen} title="Load a workout" onClose={() => setWorkoutPickerOpen(false)}>
        <div className="space-y-6">
          {exerciseCount ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100">
              Loading a workout replaces the exercises you have now.
            </p>
          ) : null}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Your saved workouts</h3>
            {templates.length ? (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:border-forge-ember/40 hover:bg-forge-ember/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    key={template._id}
                    type="button"
                    onClick={() => loadFromWorkoutPicker(template)}
                  >
                    <p className="font-bold text-white">{template.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{template.exercises.length} exercises</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No saved workouts yet.{" "}
                <Link className="font-semibold text-orange-300 hover:text-orange-200" to="/workout-templates">
                  Design one
                </Link>
              </p>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Sent to you by friends</h3>
            {inboxWorkouts.length ? (
              <div className="space-y-2">
                {inboxWorkouts.map((item) => (
                  <button
                    className="w-full rounded-2xl border border-forge-ember/20 bg-forge-ember/[0.06] p-4 text-left transition-colors hover:bg-forge-ember/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    key={item._id}
                    type="button"
                    onClick={() => loadFromWorkoutPicker(item)}
                  >
                    <p className="font-bold text-white">{item.workoutName}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      From @{item.fromUserId?.username} · {item.exercises.length} exercises
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nothing sent to you yet.</p>
            )}
          </section>
        </div>
      </BottomSheet>

      <BottomSheet open={notesOpen} title="Workout notes" onClose={() => setNotesOpen(false)}>
        <label className="sr-only" htmlFor="gym-notes">
          Workout notes
        </label>
        <textarea
          className="min-h-40 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-base leading-7 text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
          id="gym-notes"
          placeholder="How did it feel? Anything to remember next time?"
          value={workout.notes}
          onChange={(event) => setWorkout({ ...workout, notes: event.target.value })}
        />
        <button
          className="mt-3 min-h-12 w-full rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02]"
          type="button"
          onClick={() => setNotesOpen(false)}
        >
          Done
        </button>
      </BottomSheet>

      {dialog ? <GymDialog {...dialog} onClose={() => setDialog(null)} /> : null}

      {savedResult ? (
        <SessionSummary
          analysis={savedResult.analysis}
          detailsHref={savedResult.workout?._id ? `/workouts/${savedResult.workout._id}` : undefined}
          durationSeconds={Math.round((savedResult.finishedAt - new Date(savedResult.startedAt).getTime()) / 1000)}
          title={savedResult.title}
          onStartAnother={resetWorkout}
        />
      ) : null}

      <GuidedTutorial active={tourToken > 0} autoStart={tourToken === 0} key={tourToken} pageKey="gym_mode" steps={getTutorialSteps("gym_mode")} />
    </div>
  );
};

export default GymModePage;
