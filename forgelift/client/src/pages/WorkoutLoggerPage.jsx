import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import RankPromotionModal from "../components/ranks/RankPromotionModal.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import RpeGuide from "../components/ui/RpeGuide.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { overloadService } from "../services/overloadService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";
import { workoutService } from "../services/workoutService.js";
import { helpText } from "../utils/helpText.js";
import { copySetForNext, createEmptySet, describeSetLoad, isSetValid, normalizeSetForSave } from "../utils/workoutSetUtils.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const WorkoutLoggerPage = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [strengthBaselines, setStrengthBaselines] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedResult, setSavedResult] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    notes: "",
    sessionRPE: "",
    soreness: "",
    sleepQuality: "",
    energyLevel: "",
    exercises: []
  });

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const [exerciseData, recentData, overloadData, baselineData] = await Promise.all([
          exerciseService.getExercises(),
          workoutService.getRecentExercises(),
          overloadService.getOverloadRecommendations(),
          strengthBaselineService.getStrengthBaselines()
        ]);
        setExercises(exerciseData.exercises);
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

  const addExerciseObject = (exercise) => {
    if (!exercise) {
      setError("Choose an exercise to add.");
      return;
    }

    const exerciseType = exercise.exerciseType || "";
    setError("");
    setForm({
      ...form,
      exercises: [
        ...form.exercises,
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
          sets: [createEmptySet({ exerciseType, bodyweight: user?.bodyweight })]
        }
      ]
    });
  };

  const addExerciseByName = (exerciseName) => {
    addExerciseObject(exercises.find((item) => item.name === exerciseName) || recentExercises.find((item) => item.exerciseName === exerciseName));
  };

  const suggestedExerciseNames = useMemo(
    () => overloadRecommendations.slice(0, 8).map((recommendation) => recommendation.exerciseName),
    [overloadRecommendations]
  );

  const getStrengthBaseline = (exerciseName) =>
    strengthBaselines.find((baseline) => baseline.exerciseName === exerciseName);

  const removeExercise = (exerciseIndex) => {
    setForm({
      ...form,
      exercises: form.exercises.filter((_exercise, index) => index !== exerciseIndex)
    });
  };

  const addSet = (exerciseIndex) => {
    const exercise = form.exercises[exerciseIndex];
    const lastSet = exercise?.sets?.[exercise.sets.length - 1];
    if (!isSetValid(lastSet)) return;
    setForm({
      ...form,
      exercises: form.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, sets: [...exercise.sets, copySetForNext(lastSet || createEmptySet({ exerciseType: exercise.exerciseType, bodyweight: user?.bodyweight }))] } : exercise
      )
    });
  };

  const repeatLastSet = (exerciseIndex) => {
    const exercise = form.exercises[exerciseIndex];
    const lastSet = exercise?.sets?.[exercise.sets.length - 1];
    if (!lastSet) return;
    setForm({
      ...form,
      exercises: form.exercises.map((item, index) =>
        index === exerciseIndex ? { ...item, sets: [...item.sets, copySetForNext(lastSet)] } : item
      )
    });
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setForm({
      ...form,
      exercises: form.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_set, currentSetIndex) => currentSetIndex !== setIndex) }
          : exercise
      )
    });
  };

  const updateSet = (exerciseIndex, setIndex, key, value) => {
    setForm({
      ...form,
      exercises: form.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [key]: value } : set
              )
            }
          : exercise
      )
    });
  };

  const patchSet = (exerciseIndex, setIndex, patch) => {
    setForm({
      ...form,
      exercises: form.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, ...patch } : set
              )
            }
          : exercise
      )
    });
  };

  const useSuggestedWeight = (exerciseIndex) => {
    const baseline = getStrengthBaseline(form.exercises[exerciseIndex]?.exerciseName);
    if (!baseline) return;
    const selectedExercise = form.exercises[exerciseIndex];
    const suggestedTotal = Number(baseline.suggestedWorkingWeight || baseline.workingWeight) || 0;
    const bodyweight = Number(user?.bodyweight) || 0;
    const addedLoad = Math.max(0, suggestedTotal - bodyweight);

    setForm({
      ...form,
      exercises: form.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, setIndex) =>
                setIndex === 0
                  ? {
                      ...set,
                      weight: selectedExercise.exerciseType === "bodyweight" && bodyweight ? bodyweight + addedLoad : String(suggestedTotal || ""),
                      totalLoad: selectedExercise.exerciseType === "bodyweight" && bodyweight ? bodyweight + addedLoad : String(suggestedTotal || ""),
                      bodyweightUsed: selectedExercise.exerciseType === "bodyweight" && bodyweight ? bodyweight : set.bodyweightUsed,
                      addedLoad: selectedExercise.exerciseType === "bodyweight" && bodyweight ? addedLoad : set.addedLoad,
                      bodyweightOnly: selectedExercise.exerciseType === "bodyweight" && bodyweight ? addedLoad === 0 : set.bodyweightOnly,
                      reps: String(baseline.reps || "")
                    }
                  : set
              )
            }
          : exercise
      )
    });
  };

  const validateWorkout = () => {
    if (form.exercises.length === 0) {
      return "Add at least one exercise before saving.";
    }

    for (const exercise of form.exercises) {
      if (exercise.sets.length === 0) {
        return `${exercise.exerciseName} needs at least one set.`;
      }

      for (const set of exercise.sets) {
        if (exercise.exerciseType === "bodyweight" && !user?.bodyweight) {
          return "Add your bodyweight in Profile before saving bodyweight exercise sets.";
        }
        if (!isSetValid(set)) return "Enter a valid load and reps before saving.";
        if (!set.reps || Number(set.reps) <= 0) return "Reps must be positive.";
        if (set.rpe && (Number(set.rpe) < 1 || Number(set.rpe) > 10)) return "Set RPE must be between 1 and 10.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateWorkout();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        exercises: form.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map(normalizeSetForSave)
        }))
      };
      const data = await workoutService.createWorkout(payload);
      setSavedResult(data);
      setShowPromotionModal(Boolean(data.analysis?.rankPromotions?.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <ExercisePicker
        open={pickerOpen}
        exercises={exercises}
        recentExercises={recentExercises}
        suggestions={suggestedExerciseNames}
        onClose={() => setPickerOpen(false)}
        onSelect={addExerciseObject}
      />
      <RankPromotionModal
        promotions={showPromotionModal ? savedResult?.analysis?.rankPromotions || [] : []}
        xpEarned={savedResult?.analysis?.xpEarned || 0}
        onClose={() => setShowPromotionModal(false)}
      />

      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Workout Logger</p>
        <h1 className="mt-2 text-3xl font-black text-white">Log a workout</h1>
        <div className="mt-4">
          <TutorialLauncher pageKey="workout_logger" steps={getTutorialSteps("workout_logger")} />
        </div>
      </div>

      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {savedResult?.analysis ? (
        <section className="metal-panel mb-6 rounded-lg border-forge-copper/40 p-5 shadow-metal">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Workout saved</p>
              <h2 className="mt-2 text-2xl font-black text-white">Analysis summary</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                to={`/workouts/${savedResult.workout._id}`}
              >
                View details
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                to="/workouts"
              >
                History
              </Link>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["XP earned", `+${savedResult.analysis.xpEarned || 0}`],
              ["Total volume", `${formatNumber(savedResult.analysis.totalVolume)}kg`],
              ["Total sets", savedResult.analysis.totalSets],
              ["Average RPE", savedResult.analysis.averageRPE || "-"]
            ].map(([label, value]) => (
              <div className="rounded-md bg-black/25 p-4" key={label}>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-bold text-white">Main muscles worked</h3>
              <div className="flex flex-wrap gap-2">
                {savedResult.analysis.mainMusclesWorked.map((muscle) => (
                  <span className="rounded-full bg-forge-ember/15 px-3 py-1 text-sm font-semibold text-orange-200" key={muscle}>
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-bold text-white">New PRs</h3>
              {savedResult.analysis.newPersonalRecords.length ? (
                <div className="space-y-2 text-sm text-slate-300">
                  {savedResult.analysis.newPersonalRecords.map((record) => (
                    <p key={record._id}>
                      {record.exerciseName}: {record.recordType.replaceAll("_", " ")} ({formatNumber(record.value)})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No new personal records this time.</p>
              )}
            </div>
          </div>

          {savedResult.analysis.updatedRanks ? (
            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <h3 className="mb-3 font-bold text-white">Updated rank</h3>
              <p className="text-sm text-slate-300">
                Overall Rank {savedResult.analysis.updatedRanks.overallRank},{" "}
                {savedResult.analysis.updatedRanks.overallProgress?.progressPercentage || 0}% to{" "}
                {savedResult.analysis.updatedRanks.overallProgress?.nextRank?.name || "max rank"}.
              </p>
              {savedResult.analysis.rankPromotions?.length ? (
                <div className="mt-3 space-y-1 text-sm text-orange-200">
                  {savedResult.analysis.rankPromotions.map((promotion, index) => (
                    <p key={`${promotion.message}-${index}`}>{promotion.message}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No rank promotion this session.</p>
              )}
            </div>
          ) : null}

          {savedResult.analysis.recoverySummary?.length ? (
            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <h3 className="mb-3 font-bold text-white">Recovery impact</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {savedResult.analysis.recoverySummary.slice(0, 6).map((recovery) => (
                  <div className="rounded-md bg-black/25 p-3 text-sm" key={recovery.muscleGroup}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{recovery.muscleGroup}</p>
                      <span className="text-forge-copper">{recovery.score}%</span>
                    </div>
                    <p className="mt-1 text-slate-400">
                      Rest heavy work for around {recovery.restRecommendationHours || 0} hours.
                    </p>
                    <p className="mt-2 text-slate-500">{recovery.reasons?.[0]}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Pressing movements can indirectly load front shoulders and triceps even when the session is chest-focused.
              </p>
            </div>
          ) : null}

          {savedResult.analysis.trainingBalanceSummary ? (
            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <h3 className="mb-3 font-bold text-white">Training balance and weak points</h3>
              <p className="text-sm text-slate-300">
                Training Balance Score: {savedResult.analysis.trainingBalanceSummary.score}/100,{" "}
                {savedResult.analysis.trainingBalanceSummary.status}.
              </p>
              {savedResult.analysis.trainingBalanceSummary.warnings?.[0] ? (
                <p className="mt-2 text-sm text-orange-200">{savedResult.analysis.trainingBalanceSummary.warnings[0]}</p>
              ) : null}
              {savedResult.analysis.weakPointsSummary?.length ? (
                <div className="mt-4 space-y-2">
                  {savedResult.analysis.weakPointsSummary.slice(0, 3).map((weakPoint) => (
                    <div className="rounded-md bg-black/25 p-3 text-sm" key={weakPoint._id || weakPoint.title}>
                      <p className="font-bold text-white">{weakPoint.title}</p>
                      <p className="mt-1 text-slate-400">{weakPoint.message}</p>
                      <p className="mt-1 text-forge-copper">{weakPoint.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No active weak points detected.</p>
              )}
            </div>
          ) : null}

          {savedResult.analysis.overloadRecommendations?.length ? (
            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-white">Smart overload targets</h3>
                <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/overload">
                  View all
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {savedResult.analysis.overloadRecommendations.slice(0, 4).map((recommendation) => (
                  <div className="rounded-md bg-black/25 p-3 text-sm" key={recommendation._id || recommendation.exerciseName}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-white">{recommendation.exerciseName}</p>
                      <span className="rounded-full bg-forge-ember/15 px-2 py-1 text-xs font-bold text-orange-200">
                        {recommendation.recommendationType?.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-400">{recommendation.reason}</p>
                    {recommendation.warnings?.[0] ? (
                      <p className="mt-2 text-orange-200">{recommendation.warnings[0]}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {savedResult.analysis.deloadSummary?.length ||
          savedResult.analysis.plateauSummary?.length ||
          (savedResult.analysis.fatigueSummary && savedResult.analysis.fatigueSummary.fatigueLevel !== "Low") ? (
            <div className="mt-5 rounded-md border border-orange-400/20 bg-orange-500/10 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-white">Smart deload check</h3>
                <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/deload">
                  Deload page
                </Link>
              </div>
              {savedResult.analysis.plateauSummary?.slice(0, 3).map((plateau) => (
                <p className="mb-2 text-sm text-orange-100" key={plateau.exerciseName}>
                  Plateau risk detected: {plateau.reason}
                </p>
              ))}
              {savedResult.analysis.fatigueSummary?.reasons?.slice(0, 2).map((reason) => (
                <p className="mb-2 text-sm text-slate-300" key={reason}>
                  Fatigue warning: {reason}
                </p>
              ))}
              {savedResult.analysis.deloadSummary?.slice(0, 3).map((deload) => (
                <div className="mt-3 rounded-md bg-black/25 p-3 text-sm" key={deload._id || deload.reason}>
                  <p className="font-bold text-white">
                    Deload recommended: {deload.exerciseName || deload.muscleGroup || "Full body"}
                  </p>
                  <p className="mt-1 text-orange-200">{deload.reason}</p>
                  {deload.plan?.nextSessionTarget ? (
                    <p className="mt-1 text-slate-400">{deload.plan.nextSessionTarget}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {savedResult.analysis.missionSummary ? (
            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-white">Mission progress</h3>
                <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/missions">
                  Missions page
                </Link>
              </div>
              <p className="text-sm text-slate-300">
                Weekly target progress: {savedResult.analysis.missionSummary.weeklyProgress}.
              </p>
              {savedResult.analysis.newlyCompletedMissions?.length ? (
                <div className="mt-4 space-y-2">
                  {savedResult.analysis.newlyCompletedMissions.map((mission) => (
                    <div className="rounded-md bg-green-500/10 p-3 text-sm" key={mission._id || mission.title}>
                      <p className="font-bold text-white">Mission completed: {mission.title}</p>
                      <p className="mt-1 text-green-200">+{mission.xpReward || 0} XP</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  Mission progress updated. {savedResult.analysis.missionSummary.activeCount} active missions remain.
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(savedResult.analysis.muscleLoadSummary || {}).map(([muscle, load]) => (
              <div className="rounded-md border border-white/10 bg-black/20 p-4" key={muscle}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-white">{muscle}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                    {load.loadLevel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Total load: {formatNumber(load.totalLoad)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Direct {formatNumber(load.directLoad)} / Indirect {formatNumber(load.indirectLoad)} / Stabiliser{" "}
                  {formatNumber(load.stabiliserLoad)}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-5 space-y-2 text-sm text-slate-300">
            {savedResult.analysis.summaryMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section data-tour-id="logger-workout-details" className="metal-panel rounded-lg p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Session details</h2>
          {user?.beginnerTipsEnabled !== false ? (
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <BeginnerTip title="New to RPE?">
                Start with RPE 7 to 8 for most working sets. You do not need to train at RPE 10 every set. Most
                progress comes from consistent, controlled sets.
              </BeginnerTip>
              <RpeGuide />
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput
              className="md:col-span-2"
              label="Workout title"
              placeholder="Push day"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <FormInput
              label={
                <span className="inline-flex items-center gap-1">
                  Session RPE <HelpTooltip {...helpText.rpe} />
                </span>
              }
              max="10"
              min="1"
              type="number"
              value={form.sessionRPE}
              onChange={(event) => setForm({ ...form, sessionRPE: event.target.value })}
            />
            <FormInput
              label={
                <span className="inline-flex items-center gap-1">
                  Soreness <HelpTooltip {...helpText.soreness} />
                </span>
              }
              max="10"
              min="1"
              type="number"
              value={form.soreness}
              onChange={(event) => setForm({ ...form, soreness: event.target.value })}
            />
            <FormInput
              label={
                <span className="inline-flex items-center gap-1">
                  Sleep quality <HelpTooltip {...helpText.sleepQuality} />
                </span>
              }
              max="10"
              min="1"
              type="number"
              value={form.sleepQuality}
              onChange={(event) => setForm({ ...form, sleepQuality: event.target.value })}
            />
            <FormInput
              label={
                <span className="inline-flex items-center gap-1">
                  Energy level <HelpTooltip {...helpText.energyLevel} />
                </span>
              }
              max="10"
              min="1"
              type="number"
              value={form.energyLevel}
              onChange={(event) => setForm({ ...form, energyLevel: event.target.value })}
            />
            <label className="block md:col-span-2 xl:col-span-4">
              <span className="mb-2 block text-sm font-medium text-slate-200">Notes</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-forge-ember focus:ring-2 focus:ring-forge-ember/20"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="metal-panel rounded-lg p-5">
          <h2 className="mb-5 text-xl font-bold text-white">Exercises</h2>
          <div data-tour-id="logger-add-exercise" className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-white">Choose from the exercise library</p>
                <p className="mt-1 text-sm text-slate-400">
                  Search, filter by muscle group, and preview primary, secondary, and stabiliser impact before adding.
                </p>
              </div>
              <Button className="w-full md:w-auto" disabled={loadingExercises} type="button" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                Open Exercise Picker
              </Button>
            </div>
          </div>

          {recentExercises.length || overloadRecommendations.length ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {recentExercises.length ? (
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-300">Recent exercises</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recentExercises.slice(0, 8).map((exercise) => (
                      <button
                        className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200"
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
              {overloadRecommendations.length ? (
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-300">Smart Overload suggestions</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {overloadRecommendations.slice(0, 8).map((recommendation) => (
                      <button
                        className="shrink-0 rounded-full bg-forge-ember/15 px-3 py-2 text-sm font-semibold text-orange-200"
                        key={recommendation._id}
                        type="button"
                        onClick={() => addExerciseByName(recommendation.exerciseName)}
                      >
                        {recommendation.exerciseName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {form.exercises.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-white/15 p-5 text-center text-slate-400">
              No exercises added yet. Choose from the library to start your session.
            </p>
          ) : null}

          <div className="mt-6 space-y-5">
            {form.exercises.map((exercise, exerciseIndex) => (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4" key={`${exercise.exerciseId}-${exerciseIndex}`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{exercise.exerciseName}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Primary: {exercise.primaryMuscles.join(", ") || "Not listed"}
                    </p>
                    {overloadRecommendations.find((item) => item.exerciseName === exercise.exerciseName) ? (
                      <p className="mt-2 rounded-md bg-forge-ember/10 p-2 text-sm text-orange-100">
                        {overloadRecommendations.find((item) => item.exerciseName === exercise.exerciseName).reason}
                      </p>
                    ) : null}
                    {getStrengthBaseline(exercise.exerciseName) ? (
                      <div className="mt-2 rounded-md bg-white/5 p-3 text-sm text-slate-300">
                        <p className="font-semibold text-white">
                          Suggested starting weight:{" "}
                          {formatNumber(
                            getStrengthBaseline(exercise.exerciseName).suggestedWorkingWeight ||
                              getStrengthBaseline(exercise.exerciseName).workingWeight
                          )}
                          kg for {getStrengthBaseline(exercise.exerciseName).suggestedRepRange || `${getStrengthBaseline(exercise.exerciseName).reps} reps`}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {getStrengthBaseline(exercise.exerciseName).confidence} confidence, based on{" "}
                          {getStrengthBaseline(exercise.exerciseName).sourceExerciseName || "your entered baseline"}.
                        </p>
                        <button
                          className="mt-2 text-sm font-semibold text-forge-ember hover:text-orange-300"
                          type="button"
                          onClick={() => useSuggestedWeight(exerciseIndex)}
                        >
                          Use suggested weight
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeExercise(exerciseIndex)}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="space-y-3">
                  <div data-tour-id={exerciseIndex === 0 ? "logger-set-entry" : undefined}>
                  {exercise.sets.map((set, setIndex) => (
                    <div className="rounded-lg bg-white/[0.03] p-3" key={setIndex}>
                      <div className="mb-3 flex flex-col gap-2 rounded-md bg-black/20 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-bold text-white">
                          Set {setIndex + 1}: {describeSetLoad(set)} x {set.reps || 0} reps
                        </p>
                        <p className="text-slate-400">{set.rpe ? `RPE ${set.rpe}` : "RPE not set"}</p>
                      </div>

                      {exercise.exerciseType === "bodyweight" ? (
                        <div className="mb-3 rounded-md border border-white/10 bg-black/20 p-3">
                          <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-white">
                            <input
                              checked={set.bodyweightOnly !== false}
                              className="h-4 w-4 accent-forge-ember"
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
                            <p className="mt-2 text-sm text-slate-300">Using bodyweight from profile: {user.bodyweight}kg</p>
                          ) : (
                            <div className="mt-2 flex flex-col gap-2 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
                              <span>Add your bodyweight in Profile to use bodyweight-only logging.</span>
                              <Link className="font-bold text-red-100 underline" to="/profile">Update Profile</Link>
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto]">
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
                        <FormInput
                          label={
                            <span className="inline-flex items-center gap-1">
                              Weight <HelpTooltip title="Weight" content="The load used for this set." example="For bodyweight exercises, ForgeLift can use your profile bodyweight." />
                            </span>
                          }
                          min="0"
                          type="number"
                          value={set.weight}
                          onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)}
                          required
                        />
                      )}
                      <FormInput
                        label={
                          <span className="inline-flex items-center gap-1">
                            Reps <HelpTooltip title="Reps" content="Reps are how many times you lifted the weight in this set." example="80kg x 10 means 10 reps." />
                          </span>
                        }
                        min="1"
                        type="number"
                        value={set.reps}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                        required
                      />
                      <FormInput
                        label={
                          <span className="inline-flex items-center gap-1">
                            RPE <HelpTooltip {...helpText.rpe} />
                          </span>
                        }
                        max="10"
                        min="1"
                        type="number"
                        value={set.rpe}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, "rpe", event.target.value)}
                      />
                      <FormInput
                        label="Set notes"
                        value={set.notes}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, "notes", event.target.value)}
                      />
                      <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-slate-300">
                        <input
                          checked={set.completed}
                          className="h-4 w-4 accent-forge-ember"
                          type="checkbox"
                          onChange={(event) => updateSet(exerciseIndex, setIndex, "completed", event.target.checked)}
                        />
                        Done
                        <HelpTooltip {...helpText.completedSet} size="xs" />
                      </label>
                      <Button
                        className="self-end sm:col-span-2 xl:col-span-1"
                        disabled={exercise.sets.length === 1}
                        type="button"
                        variant="ghost"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                {(!isSetValid(exercise.sets[exercise.sets.length - 1]) ||
                  (exercise.exerciseType === "bodyweight" && !user?.bodyweight)) ? (
                  <p className="mt-3 text-sm text-slate-400">
                    {exercise.exerciseType === "bodyweight"
                      ? user?.bodyweight
                        ? "Enter reps to unlock Add Set."
                        : "Add your bodyweight in Profile to unlock Add Set."
                      : "Enter weight and reps to unlock Add Set."}
                  </p>
                ) : null}
                <Button
                  className="mt-4 w-full sm:w-auto"
                  disabled={
                    !isSetValid(exercise.sets[exercise.sets.length - 1]) ||
                    (exercise.exerciseType === "bodyweight" && !user?.bodyweight)
                  }
                  type="button"
                  variant="secondary"
                  onClick={() => addSet(exerciseIndex)}
                >
                  <Plus className="h-4 w-4" />
                  Add set
                </Button>
                <Button
                  className="mt-3 w-full sm:ml-3 sm:w-auto"
                  disabled={
                    !exercise.sets.length ||
                    !isSetValid(exercise.sets[exercise.sets.length - 1]) ||
                    (exercise.exerciseType === "bodyweight" && !user?.bodyweight)
                  }
                  type="button"
                  variant="ghost"
                  onClick={() => repeatLastSet(exerciseIndex)}
                >
                  Repeat last set
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div data-tour-id="logger-save-workout" className="sticky bottom-20 z-20 flex justify-end rounded-xl bg-forge-black/90 p-2 backdrop-blur lg:static lg:bg-transparent lg:p-0">
          <Button className="min-h-14 w-full text-base sm:w-auto" loading={submitting} type="submit">
            Save workout
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default WorkoutLoggerPage;
