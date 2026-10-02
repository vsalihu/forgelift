import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import Layout from "../components/Layout.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import { setsPerMuscle } from "../components/exercises/exerciseMeta.js";
import BuilderExerciseRow from "../components/templates/BuilderExerciseRow.jsx";
import MuscleCoverage from "../components/templates/MuscleCoverage.jsx";
import CoveragePanel from "../components/templates/coverage/CoveragePanel.jsx";
import MusclePicker from "../components/templates/coverage/MusclePicker.jsx";
import PartSheet from "../components/templates/coverage/PartSheet.jsx";
import BottomSheet from "../components/ui/BottomSheet.jsx";
import SendToFriendSheet from "../components/templates/SendToFriendSheet.jsx";
import TemplateCard from "../components/templates/TemplateCard.jsx";
import { DesignWorkoutIcon, DumbbellIcon } from "../components/icons/navIcons.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { activityService } from "../services/activityService.js";
import { exerciseService } from "../services/exerciseService.js";
import { friendService } from "../services/friendService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { gymDraftInProgress, startInGymMode } from "../utils/gymHandoff.js";
import { getTemplateSuggestions } from "../utils/templateSuggestions.js";
import { autoBuild, bestGapFill, computeCoverage, groupLabelList } from "../utils/muscleMap.js";

const emptyForm = { name: "", description: "", exercises: [], targetMuscleGroups: [] };

const useIsDesktop = () => {
  const query = "(min-width: 1024px)";
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" ? window.matchMedia?.(query).matches : false));
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return undefined;
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);
  return matches;
};
const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

let rowKey = 0;
const withKey = (item) => ({ ...item, _key: `row-${(rowKey += 1)}` });
const snapshot = (form) =>
  JSON.stringify({ ...form, exercises: form.exercises.map(({ _key, ...item }) => item) });

const WorkoutTemplatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const initialRef = useRef(snapshot(emptyForm));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [startStep, setStartStep] = useState(false);
  const [musclesOpen, setMusclesOpen] = useState(false);
  const [partSheetId, setPartSheetId] = useState("");
  const [builderNotice, setBuilderNotice] = useState("");
  const isDesktop = useIsDesktop();
  const experience = user?.trainingExperience || "";

  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [pendingStart, setPendingStart] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [sendTemplate, setSendTemplate] = useState(null);
  const [sending, setSending] = useState(false);
  const [creatingSuggestion, setCreatingSuggestion] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [templateData, exerciseData, friendData] = await Promise.all([
        workoutTemplateService.getTemplates(),
        exerciseService.getExercises(),
        friendService.getFriends().catch(() => ({ friends: [] }))
      ]);
      setTemplates(templateData.templates || []);
      setExercises(exerciseData.exercises || []);
      setFriends(friendData.friends || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!builderNotice) return undefined;
    const timer = setTimeout(() => setBuilderNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [builderNotice]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const findExercise = (item) => exercises.find((exercise) => exercise._id === item.exerciseId || exercise.name === item.exerciseName);
  const topMusclesFor = (template) => setsPerMuscle(template.exercises || [], findExercise).slice(0, 3).map((entry) => entry.muscle);
  const coverage = useMemo(() => setsPerMuscle(form.exercises, findExercise), [form.exercises, exercises]);
  const builderItems = useMemo(
    () => form.exercises.map((item) => ({ exercise: findExercise(item), sets: Number(item.targetSets) || 0 })),
    [form.exercises, exercises]
  );
  const targetGroups = form.targetMuscleGroups || [];
  const groupCoverage = useMemo(() => computeCoverage(builderItems, targetGroups, experience), [builderItems, targetGroups, experience]);
  const inWorkout = useMemo(() => new Set(form.exercises.flatMap((item) => [item.exerciseId, item.exerciseName].filter(Boolean))), [form.exercises]);
  const templateCoverage = (template) => {
    const groups = template.targetMuscleGroups || [];
    if (!groups.length) return null;
    const items = (template.exercises || []).map((item) => ({ exercise: findExercise(item), sets: Number(item.targetSets) || 0 }));
    return { label: groupLabelList(groups), overall: computeCoverage(items, groups, experience).overall };
  };
  const totalSets = form.exercises.reduce((total, item) => total + (Number(item.targetSets) || 0), 0);
  const dirty = builderOpen && snapshot(form) !== initialRef.current;
  const badRow = form.exercises.some((item) => item.targetRepMin !== "" && item.targetRepMax !== "" && Number(item.targetRepMin) > Number(item.targetRepMax));
  const missing = !form.name.trim() ? "Give the workout a name." : !form.exercises.length ? "Add at least one exercise." : badRow ? "Fix the rep range marked in red." : "";

  // Builder

  const openBuilder = (template) => {
    const next = template
      ? {
          name: template.name,
          description: template.description || "",
          exercises: (template.exercises || []).map(withKey),
          targetMuscleGroups: template.targetMuscleGroups || []
        }
      : emptyForm;
    setEditingId(template?._id || "");
    setForm(next);
    initialRef.current = snapshot(next);
    setBuilderError("");
    setBuilderNotice("");
    setStartStep(!template);
    setBuilderOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    setConfirmDiscard(false);
    setStartStep(false);
    setPartSheetId("");
    setMusclesOpen(false);
    setEditingId("");
    setForm(emptyForm);
    window.scrollTo({ top: 0 });
  };

  const requestClose = () => (dirty ? setConfirmDiscard(true) : closeBuilder());

  const addExercise = (exercise) => {
    setForm((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        withKey({
          exerciseId: exercise._id,
          exerciseName: exercise.name || exercise.exerciseName,
          targetSets: 3,
          targetRepMin: exercise.defaultRepMin || 8,
          targetRepMax: exercise.defaultRepMax || 12,
          notes: ""
        })
      ]
    }));
    if (exercise._id && !exercises.some((item) => item._id === exercise._id)) setExercises((current) => [...current, exercise]);
  };

  const setTargets = (targetMuscleGroups) => setForm((current) => ({ ...current, targetMuscleGroups }));

  const finishStartStep = () => {
    setStartStep(false);
    // A sensible default name the lifter can still change.
    if (!form.name.trim() && targetGroups.length) setForm((current) => ({ ...current, name: groupLabelList(current.targetMuscleGroups) }));
  };

  const addFromCoverage = (exercise) => {
    addExercise(exercise);
    setBuilderNotice(`Added ${exercise.name}.`);
  };

  const fillNextGap = () => {
    const gap = bestGapFill(groupCoverage, exercises, { experience, inWorkout });
    if (!gap) {
      setBuilderNotice("Nothing in the library would fill the remaining gaps. Try adding sets.");
      return;
    }
    addExercise(gap.exercise);
    setBuilderNotice(`Added ${gap.exercise.name} for ${gap.part.label.toLowerCase()}.`);
  };

  const fillEveryGap = () => {
    const added = autoBuild(targetGroups, exercises, { experience, startWith: builderItems.filter((item) => item.exercise) });
    if (!added.length) {
      setBuilderNotice("Nothing in the library would fill the remaining gaps. Try adding sets.");
      return;
    }
    added.forEach(({ exercise }) => addExercise(exercise));
    setBuilderNotice(`Added ${added.length} exercise${added.length === 1 ? "" : "s"}: ${added.map(({ exercise }) => exercise.name).join(", ")}.`);
  };

  const changeExercise = (index, field, value) =>
    setForm((current) => ({ ...current, exercises: current.exercises.map((item, i) => (i === index ? { ...item, [field]: value } : item)) }));

  const moveExercise = (index, direction) =>
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.exercises.length) return current;
      const next = [...current.exercises];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, exercises: next };
    });

  const removeExercise = (index) => setForm((current) => ({ ...current, exercises: current.exercises.filter((_, i) => i !== index) }));

  const saveTemplate = async (event) => {
    event.preventDefault();
    if (missing) {
      setBuilderError(missing);
      return;
    }
    setSaving(true);
    setBuilderError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetMuscleGroups: targetGroups,
      exercises: form.exercises.map(({ _key, ...item }) => ({
        ...item,
        targetSets: Number(item.targetSets) || 3,
        targetRepMin: Number(item.targetRepMin) || 8,
        targetRepMax: Number(item.targetRepMax) || Number(item.targetRepMin) || 12
      }))
    };
    try {
      if (editingId) await workoutTemplateService.updateTemplate(editingId, payload);
      else await workoutTemplateService.createTemplate(payload);
      closeBuilder();
      setNotice(`Saved "${payload.name}".`);
      await loadData();
    } catch (err) {
      setBuilderError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // List actions

  const startTemplate = (template) => {
    if (gymDraftInProgress()) {
      setPendingStart(template);
      return;
    }
    startInGymMode(template, navigate);
  };

  const toggleVisibility = async (template) => {
    const visibility = template.visibility === "public" ? "private" : "public";
    setBusyId(template._id);
    setError("");
    try {
      const data = await workoutTemplateService.setVisibility(template._id, visibility);
      setTemplates((current) => current.map((item) => (item._id === template._id ? data.template : item)));
      setNotice(visibility === "public" ? `"${template.name}" is public. Friends can find and copy it.` : `"${template.name}" is private again.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const sendToFriend = async (template, friendId) => {
    setSending(true);
    try {
      await activityService.sendWorkout(template._id, friendId);
      const friend = friends.find((item) => item._id === friendId);
      setSendTemplate(null);
      setNotice(`Sent "${template.name}" to ${friend?.name || "your friend"}.`);
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = () => {
    const id = pendingDeleteId;
    const removed = templates.find((item) => item._id === id);
    setPendingDeleteId("");
    setError("");
    setTemplates((current) => current.filter((item) => item._id !== id));
    workoutTemplateService.deleteTemplate(id).catch((err) => {
      setError(err.message);
      if (removed) setTemplates((current) => [removed, ...current]);
    });
  };

  const createSuggestion = async (suggestion) => {
    setCreatingSuggestion(suggestion.name);
    setError("");
    try {
      await workoutTemplateService.createTemplate({ name: suggestion.name, description: "Starter workout for your goal", goalPath: user?.goalPath, exercises: suggestion.exercises });
      setNotice(`Added "${suggestion.name}". Edit it any time.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingSuggestion("");
    }
  };

  const dialogs = (
    <>
      <ExercisePicker exercises={exercises} open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={addExercise} />
      <PartSheet
        coverage={groupCoverage}
        experience={experience}
        inWorkout={inWorkout}
        library={exercises}
        partId={partSheetId}
        onAdd={addFromCoverage}
        onClose={() => setPartSheetId("")}
      />
      <BottomSheet open={musclesOpen} title="What should this workout train?" onClose={() => setMusclesOpen(false)}>
        <MusclePicker value={targetGroups} onChange={setTargets} />
        <button className={`${primaryButton} mt-6 w-full`} type="button" onClick={() => setMusclesOpen(false)}>
          Done
        </button>
      </BottomSheet>
      <SendToFriendSheet friends={friends} sending={sending} template={sendTemplate} onClose={() => setSendTemplate(null)} onSend={sendToFriend} />
      {pendingStart ? (
        <ConfirmModal
          cancelLabel="Keep my workout"
          confirmLabel="Start this one"
          description="You have a Gym Mode workout in progress. Starting this one replaces it."
          title="Replace your workout in progress?"
          tone="primary"
          onCancel={() => setPendingStart(null)}
          onConfirm={() => startInGymMode(pendingStart, navigate)}
        />
      ) : null}
      {pendingDeleteId ? (
        <ConfirmModal
          confirmLabel="Delete"
          description="Workouts you already logged from it stay saved."
          title="Delete this workout?"
          onCancel={() => setPendingDeleteId("")}
          onConfirm={confirmDelete}
        />
      ) : null}
      {confirmDiscard ? (
        <ConfirmModal
          cancelLabel="Keep editing"
          confirmLabel="Discard"
          description="Your changes to this workout haven't been saved."
          title="Discard changes?"
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={closeBuilder}
        />
      ) : null}
    </>
  );

  if (builderOpen && startStep) {
    return (
      <Layout>
        {dialogs}
        <div className="mx-auto max-w-4xl">
          <button className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-zinc-400 hover:text-white" type="button" onClick={closeBuilder}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Your workouts
          </button>
          <p className="text-sm font-semibold text-orange-300">New workout</p>
          <h1 className="font-display mt-1 text-3xl text-white sm:text-4xl">What are you training?</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Pick the muscles this workout is for. As you add exercises, meters show how well each part of them is covered, and what to add next.
          </p>
          <div className="mt-6 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6">
            <MusclePicker value={targetGroups} onChange={setTargets} />
          </div>
          <div className="mt-5 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button className="min-h-12 rounded-full px-4 text-sm font-semibold text-zinc-400 hover:text-white" type="button" onClick={() => setStartStep(false)}>
              Skip, I'll just pick exercises
            </button>
            <button className={primaryButton} disabled={!targetGroups.length} type="button" onClick={finishStartStep}>
              {targetGroups.length ? `Continue with ${groupLabelList(targetGroups)}` : "Pick at least one"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (builderOpen) {
    const coverageBlock = targetGroups.length ? (
      <CoveragePanel
        compact={!isDesktop}
        coverage={groupCoverage}
        experience={experience}
        groupIds={targetGroups}
        hasExercises={form.exercises.length > 0}
        onChangeTargets={() => setMusclesOpen(true)}
        onFillAll={fillEveryGap}
        onFillNext={fillNextGap}
        onOpenPart={setPartSheetId}
      />
    ) : (
      <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
        <h2 className="font-display text-lg text-white">Muscle coverage</h2>
        <p className="mt-1 text-sm text-zinc-400">Pick the muscles you're aiming for to see which parts this workout covers and what's missing.</p>
        <button className={`${secondaryButton} mt-3 w-full`} type="button" onClick={() => setMusclesOpen(true)}>
          Pick target muscles
        </button>
        {form.exercises.length ? (
          <>
            <h3 className="mb-3 mt-5 text-sm font-semibold text-zinc-300">Sets per muscle</h3>
            <MuscleCoverage entries={coverage} />
          </>
        ) : null}
      </section>
    );
    const saveBlock = (
      <div className="space-y-2">
        {builderError ? (
          <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {builderError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <button className={primaryButton} disabled={saving} type="submit">
            {saving ? "Saving..." : editingId ? "Save changes" : "Save workout"}
          </button>
          {missing && !builderError ? <p className="text-center text-xs text-zinc-500">{missing}</p> : null}
          <button className={secondaryButton} type="button" onClick={requestClose}>
            Cancel
          </button>
        </div>
      </div>
    );

    return (
      <Layout>
        {dialogs}
        <form className="mx-auto max-w-6xl" noValidate onSubmit={saveTemplate}>
          <button className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-zinc-400 hover:text-white" type="button" onClick={requestClose}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Your workouts
          </button>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0 space-y-5">
              <div>
                <p className="text-sm font-semibold text-orange-300">{editingId ? "Edit workout" : "New workout"}</p>
                <label className="sr-only" htmlFor="template-name">
                  Workout name
                </label>
                <input
                  autoComplete="off"
                  className="font-display mt-1 w-full border-b border-white/10 bg-transparent pb-2 text-3xl text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-forge-ember/60 sm:text-4xl"
                  id="template-name"
                  maxLength={80}
                  placeholder="Name your workout"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <label className="sr-only" htmlFor="template-description">
                  Description
                </label>
                <input
                  autoComplete="off"
                  className="mt-3 w-full bg-transparent text-base text-zinc-300 outline-none placeholder:text-zinc-600"
                  id="template-description"
                  maxLength={200}
                  placeholder="Add a short description (optional)"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
                <p className="mt-3 text-sm text-zinc-500">
                  {form.exercises.length} exercise{form.exercises.length === 1 ? "" : "s"} · {totalSets} sets
                </p>
              </div>

              {isDesktop ? null : coverageBlock}

              <p aria-live="polite" className={`text-sm font-semibold text-emerald-300 ${builderNotice ? "" : "sr-only"}`}>
                {builderNotice}
              </p>

              {form.exercises.length ? (
                <ol className="space-y-2.5">
                  {form.exercises.map((item, index) => {
                    const library = findExercise(item);
                    return (
                      <BuilderExerciseRow
                        count={form.exercises.length}
                        index={index}
                        item={item}
                        key={item._key}
                        muscles={library?.primaryMuscles?.slice(0, 3) || []}
                        onChange={changeExercise}
                        onMove={moveExercise}
                        onRemove={removeExercise}
                      />
                    );
                  })}
                </ol>
              ) : null}

              <button
                className={`flex w-full items-center justify-center gap-3 rounded-3xl border border-dashed text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  form.exercises.length ? "min-h-14 border-white/15 text-zinc-300 hover:border-forge-ember/50 hover:text-white" : "min-h-40 flex-col border-forge-ember/30 bg-forge-ember/[0.04] text-zinc-200 hover:border-forge-ember/60"
                }`}
                type="button"
                onClick={() => setPickerOpen(true)}
              >
                {form.exercises.length ? (
                  <>
                    <Plus aria-hidden="true" className="h-4 w-4 text-orange-300" />
                    Add another exercise
                  </>
                ) : (
                  <>
                    <DumbbellIcon aria-hidden="true" className="h-8 w-8 text-orange-300" />
                    <span className="font-display text-xl text-white">Add your first exercise</span>
                    <span className="font-normal text-zinc-400">
                      {targetGroups.length ? "Search the library, or tap a muscle part to see what trains it." : "Search the library or filter by muscle."}
                    </span>
                  </>
                )}
              </button>

              {isDesktop ? null : saveBlock}
            </div>

            {isDesktop ? (
              <aside className="scrollbar-none space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-2">
                {coverageBlock}
                {saveBlock}
              </aside>
            ) : null}
          </div>
        </form>
      </Layout>
    );
  }

  const suggestions = getTemplateSuggestions(user?.goalPath);

  return (
    <Layout>
      {dialogs}
      <PageHeader
        actions={
          templates.length ? (
            <button className={primaryButton} type="button" onClick={() => openBuilder(null)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              New workout
            </button>
          ) : null
        }
        description="Build workouts once, then start them in Gym Mode with one tap."
        eyebrow="Design a workout"
        title="Your workouts"
      />

      {notice ? (
        <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm font-semibold text-emerald-200" role="status">
          {notice}
        </p>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadData} /> : null}

      {loading ? (
        <div aria-busy="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
          ))}
        </div>
      ) : null}

      {!loading && templates.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template, index) => (
            <TemplateCard
              busy={busyId === template._id}
              index={index}
              key={template._id}
              template={template}
              coverage={templateCoverage(template)}
              topMuscles={topMusclesFor(template)}
              onDelete={setPendingDeleteId}
              onEdit={openBuilder}
              onSend={setSendTemplate}
              onStart={startTemplate}
              onToggleVisibility={toggleVisibility}
            />
          ))}
        </div>
      ) : null}

      {!loading && !error && !templates.length ? (
        <div className="space-y-6">
          <section className="relative overflow-clip rounded-[2rem] border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.14] via-white/[0.02] to-transparent p-6 sm:p-8">
            <DesignWorkoutIcon aria-hidden="true" className="h-10 w-10 text-orange-300" />
            <h2 className="font-display mt-4 text-3xl text-white">Build your first workout.</h2>
            <p className="mt-2 max-w-lg text-zinc-300">Pick the exercises, sets and reps once. Next time you train, start it in Gym Mode and just tick off sets.</p>
            <button className={`${primaryButton} mt-5`} type="button" onClick={() => openBuilder(null)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              New workout
            </button>
          </section>

          {suggestions.length ? (
            <section>
              <h2 className="font-display text-xl text-white">Or start from one of these</h2>
              <p className="mt-1 text-sm text-zinc-400">Picked for your goal{user?.goalPath ? `, ${user.goalPath}` : ""}. You can edit them after.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <article className="flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4" key={suggestion.name}>
                    <h3 className="font-display text-lg text-white">{suggestion.name}</h3>
                    <ol className="mt-2 flex-1 space-y-1 text-sm text-zinc-400">
                      {suggestion.exercises.map((item) => (
                        <li className="flex justify-between gap-3" key={item.exerciseName}>
                          <span className="truncate">{item.exerciseName}</span>
                          <span className="shrink-0 tabular-nums text-zinc-500">
                            {item.targetSets} × {item.targetRepMin}-{item.targetRepMax}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <button
                      className={`${secondaryButton} mt-4 min-h-11`}
                      disabled={Boolean(creatingSuggestion)}
                      type="button"
                      onClick={() => createSuggestion(suggestion)}
                    >
                      {creatingSuggestion === suggestion.name ? "Adding..." : "Use this one"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Layout>
  );
};

export default WorkoutTemplatesPage;
