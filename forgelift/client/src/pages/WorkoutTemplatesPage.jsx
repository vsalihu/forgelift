import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Dumbbell, Plus, X } from "lucide-react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import ExercisePicker from "../components/exercises/ExercisePicker.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { activityService } from "../services/activityService.js";
import { exerciseService } from "../services/exerciseService.js";
import { friendService } from "../services/friendService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { getTemplateSuggestions } from "../utils/templateSuggestions.js";

const emptyTemplate = { name: "", description: "", exercises: [] };
const numberFieldClass = "min-h-10 w-16 rounded-md border border-white/10 bg-black/30 px-2 text-center text-sm text-white outline-none focus:border-forge-ember";

const WorkoutTemplatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [friends, setFriends] = useState([]);
  const [form, setForm] = useState(emptyTemplate);
  const [editingId, setEditingId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [visibilityBusyId, setVisibilityBusyId] = useState("");
  const [sendPickerId, setSendPickerId] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [sentConfirmationId, setSentConfirmationId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [templateData, exerciseData, friendData] = await Promise.all([
        workoutTemplateService.getTemplates(),
        exerciseService.getExercises(),
        friendService.getFriends()
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

  const findLibraryExercise = (templateExercise) =>
    exercises.find(
      (exercise) => exercise._id === templateExercise.exerciseId || exercise.name === templateExercise.exerciseName
    );

  const addExerciseFromPicker = (exercise) => {
    setForm((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          targetSets: 3,
          targetRepMin: exercise.defaultRepMin || 8,
          targetRepMax: exercise.defaultRepMax || 12,
          notes: ""
        }
      ]
    }));
    if (!exercises.some((item) => item._id === exercise._id)) {
      setExercises((current) => [...current, exercise]);
    }
  };

  const updateExerciseField = (index, field, value) => {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, currentIndex) =>
        currentIndex === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const removeExercise = (index) => {
    setForm((current) => ({ ...current, exercises: current.exercises.filter((_item, current2) => current2 !== index) }));
  };

  const moveExercise = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.exercises.length) return;
    setForm((current) => {
      const nextExercises = [...current.exercises];
      [nextExercises[index], nextExercises[targetIndex]] = [nextExercises[targetIndex], nextExercises[index]];
      return { ...current, exercises: nextExercises };
    });
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) await workoutTemplateService.updateTemplate(editingId, form);
      else await workoutTemplateService.createTemplate(form);
      setForm(emptyTemplate);
      setEditingId("");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editTemplate = (template) => {
    setEditingId(template._id);
    setForm({
      name: template.name,
      description: template.description || "",
      exercises: template.exercises || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(emptyTemplate);
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this workout template?")) return;
    setError("");
    try {
      await workoutTemplateService.deleteTemplate(templateId);
      setTemplates((current) => current.filter((item) => item._id !== templateId));
      if (editingId === templateId) cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const startTemplate = (template) => {
    localStorage.setItem("forgeliftGymModeTemplate", JSON.stringify(template));
    navigate("/gym-mode");
  };

  const toggleVisibility = async (template) => {
    const nextVisibility = template.visibility === "public" ? "private" : "public";
    setVisibilityBusyId(template._id);
    setError("");
    try {
      const data = await workoutTemplateService.setVisibility(template._id, nextVisibility);
      setTemplates((current) => current.map((item) => (item._id === template._id ? data.template : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setVisibilityBusyId("");
    }
  };

  const openSendPicker = (templateId) => {
    setSentConfirmationId("");
    setSelectedFriendId("");
    setSendPickerId(sendPickerId === templateId ? "" : templateId);
  };

  const sendTemplate = async (templateId) => {
    if (!selectedFriendId) return;
    setSendingId(templateId);
    setError("");
    try {
      await activityService.sendWorkout(templateId, selectedFriendId);
      setSentConfirmationId(templateId);
      setSendPickerId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingId("");
    }
  };

  const createSuggestion = async (suggestion) => {
    await workoutTemplateService.createTemplate({
      name: suggestion.name,
      description: "Starter template suggestion",
      goalPath: user?.goalPath,
      exercises: suggestion.exercises
    });
    await loadData();
  };

  const totalSets = form.exercises.reduce((total, exercise) => total + (Number(exercise.targetSets) || 0), 0);

  return (
    <Layout>
      <ExercisePicker
        open={pickerOpen}
        exercises={exercises}
        onClose={() => setPickerOpen(false)}
        onSelect={addExerciseFromPicker}
      />

      <PageHeader
        eyebrow="Workout Builder"
        title="Design a Workout"
        description="Search the exercise library, filter by muscle group, or add your own movement, then save it to train later."
        actions={
          <Link className="inline-flex min-h-11 items-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white" to="/gym-mode">
            Start Gym Mode
          </Link>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingSkeleton rows={4} /> : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form className="metal-panel rounded-xl p-5" onSubmit={saveTemplate}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-forge-copper">1. Basics</p>
                <h2 className="mt-1 text-xl font-bold text-white">{editingId ? "Edit workout" : "New workout"}</h2>
              </div>
              {editingId ? (
                <button className="text-sm font-semibold text-slate-400 hover:text-white" type="button" onClick={cancelEdit}>
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Workout name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <FormInput label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>

            <div className="mb-3 mt-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-forge-copper">2. Exercises</p>
                <p className="mt-1 text-sm text-slate-400">
                  {form.exercises.length ? `${form.exercises.length} exercises · ${totalSets} total sets` : "No exercises added yet."}
                </p>
              </div>
              <Button type="button" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Exercise
              </Button>
            </div>

            {form.exercises.length ? (
              <div className="space-y-3">
                {form.exercises.map((exercise, index) => {
                  const libraryExercise = findLibraryExercise(exercise);
                  return (
                    <div className="rounded-lg border border-white/10 bg-black/25 p-3" key={`${exercise.exerciseName}-${index}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{exercise.exerciseName}</p>
                          {libraryExercise?.primaryMuscles?.length ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {libraryExercise.primaryMuscles.slice(0, 3).map((muscle) => (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300" key={muscle}>
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            disabled={index === 0}
                            type="button"
                            onClick={() => moveExercise(index, -1)}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            disabled={index === form.exercises.length - 1}
                            type="button"
                            onClick={() => moveExercise(index, 1)}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10"
                            type="button"
                            onClick={() => removeExercise(index)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                        <label className="flex items-center gap-2">
                          Sets
                          <input
                            className={numberFieldClass}
                            min="1"
                            type="number"
                            value={exercise.targetSets}
                            onChange={(event) => updateExerciseField(index, "targetSets", Number(event.target.value) || 1)}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          Reps
                          <input
                            className={numberFieldClass}
                            min="1"
                            type="number"
                            value={exercise.targetRepMin}
                            onChange={(event) => updateExerciseField(index, "targetRepMin", Number(event.target.value) || 1)}
                          />
                          <span className="text-slate-500">to</span>
                          <input
                            className={numberFieldClass}
                            min="1"
                            type="number"
                            value={exercise.targetRepMax}
                            onChange={(event) => updateExerciseField(index, "targetRepMax", Number(event.target.value) || 1)}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                className="w-full rounded-lg border border-dashed border-white/15 p-6 text-center text-slate-400 hover:border-forge-copper/60 hover:text-white"
                type="button"
                onClick={() => setPickerOpen(true)}
              >
                <Dumbbell className="mx-auto mb-2 h-6 w-6" />
                Search or filter the exercise library to add your first movement.
              </button>
            )}

            <Button className="mt-5 w-full" disabled={!form.exercises.length} loading={saving} type="submit">
              {editingId ? "Save workout" : "Save workout"}
            </Button>
          </form>

          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-forge-copper">Your workouts</p>
            {templates.length ? (
              <div className="space-y-4">
                {templates.map((template) => (
                  <article className="metal-panel rounded-lg p-5" key={template._id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-white">{template.name}</h2>
                          <Badge tone={template.visibility === "public" ? "orange" : "neutral"}>
                            {template.visibility === "public" ? "Public" : "Private"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{template.description || "No description"}</p>
                        <p className="mt-2 text-sm text-forge-copper">{template.exercises.length} exercises</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => startTemplate(template)}>Start</Button>
                        <Button
                          loading={visibilityBusyId === template._id}
                          type="button"
                          variant="secondary"
                          onClick={() => toggleVisibility(template)}
                        >
                          {template.visibility === "public" ? "Make Private" : "Make Public"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => openSendPicker(template._id)}>
                          Send to...
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => editTemplate(template)}>Edit</Button>
                        <Button type="button" variant="ghost" onClick={() => deleteTemplate(template._id)}>Delete</Button>
                      </div>
                    </div>

                    {sendPickerId === template._id ? (
                      <div className="mt-4 flex flex-col gap-2 rounded-md bg-black/25 p-3 sm:flex-row sm:items-center">
                        {friends.length ? (
                          <>
                            <select
                              className="min-h-11 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-white"
                              value={selectedFriendId}
                              onChange={(event) => setSelectedFriendId(event.target.value)}
                            >
                              <option value="">Choose a friend...</option>
                              {friends.map((friend) => (
                                <option key={friend._id} value={friend._id}>{friend.name} (@{friend.username})</option>
                              ))}
                            </select>
                            <Button
                              disabled={!selectedFriendId}
                              loading={sendingId === template._id}
                              type="button"
                              onClick={() => sendTemplate(template._id)}
                            >
                              Send
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">Add a friend first to send workouts.</p>
                        )}
                      </div>
                    ) : null}
                    {sentConfirmationId === template._id ? (
                      <p className="mt-3 text-sm font-semibold text-emerald-300">Sent!</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <EmptyState title="No workouts yet" description="Design one on the left, or start from a suggestion for your goal path." />
                <div className="grid gap-3 md:grid-cols-2">
                  {getTemplateSuggestions(user?.goalPath).map((suggestion) => (
                    <button className="rounded-lg border border-white/10 bg-black/20 p-4 text-left hover:border-forge-copper/60" key={suggestion.name} type="button" onClick={() => createSuggestion(suggestion)}>
                      <p className="font-bold text-white">{suggestion.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{suggestion.exercises.map((exercise) => exercise.exerciseName).join(", ")}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default WorkoutTemplatesPage;
