import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { workoutTemplateService } from "../services/workoutTemplateService.js";
import { getTemplateSuggestions } from "../utils/templateSuggestions.js";

const emptyTemplate = { name: "", description: "", exercises: [] };

const WorkoutTemplatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState(emptyTemplate);
  const [editingId, setEditingId] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [templateData, exerciseData] = await Promise.all([
        workoutTemplateService.getTemplates(),
        exerciseService.getExercises()
      ]);
      setTemplates(templateData.templates || []);
      setExercises(exerciseData.exercises || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exerciseOptions = useMemo(
    () => exercises.map((exercise) => ({ value: exercise._id, label: exercise.name })),
    [exercises]
  );

  const addExercise = () => {
    const exercise = exercises.find((item) => item._id === selectedExerciseId);
    if (!exercise) return;
    setForm({
      ...form,
      exercises: [
        ...form.exercises,
        {
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          targetSets: 3,
          targetRepMin: exercise.defaultRepMin || 8,
          targetRepMax: exercise.defaultRepMax || 12,
          notes: ""
        }
      ]
    });
    setSelectedExerciseId("");
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

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this workout template?")) return;
    await workoutTemplateService.deleteTemplate(templateId);
    await loadData();
  };

  const startTemplate = (template) => {
    localStorage.setItem("forgeliftGymModeTemplate", JSON.stringify(template));
    navigate("/gym-mode");
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

  return (
    <Layout>
      <PageHeader
        eyebrow="Templates"
        title="Workout templates"
        description="Build repeatable sessions and start them quickly from Gym Mode."
        actions={
          <Link className="inline-flex min-h-11 items-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white" to="/gym-mode">
            Start Gym Mode
          </Link>
        }
      />
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingSkeleton rows={4} /> : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="metal-panel rounded-lg p-5" onSubmit={saveTemplate}>
            <h2 className="mb-4 text-xl font-bold text-white">{editingId ? "Edit template" : "Create template"}</h2>
            <div className="grid gap-4">
              <FormInput label="Template name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <FormInput label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <div className="flex gap-2">
                <select
                  className="min-h-11 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-white"
                  value={selectedExerciseId}
                  onChange={(event) => setSelectedExerciseId(event.target.value)}
                >
                  <option value="">Choose exercise...</option>
                  {exerciseOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={addExercise}>Add</Button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {form.exercises.map((exercise, index) => (
                <div className="rounded-md bg-black/25 p-3 text-sm" key={`${exercise.exerciseName}-${index}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{exercise.exerciseName}</span>
                    <button className="text-red-300" type="button" onClick={() => setForm({ ...form, exercises: form.exercises.filter((_item, current) => current !== index) })}>
                      Remove
                    </button>
                  </div>
                  <p className="mt-1 text-slate-400">{exercise.targetSets} sets / {exercise.targetRepMin}-{exercise.targetRepMax} reps</p>
                </div>
              ))}
            </div>
            <Button className="mt-5 w-full" loading={saving} type="submit">{editingId ? "Save template" : "Create template"}</Button>
          </form>

          <section>
            {templates.length ? (
              <div className="space-y-4">
                {templates.map((template) => (
                  <article className="metal-panel rounded-lg p-5" key={template._id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-black text-white">{template.name}</h2>
                        <p className="mt-1 text-sm text-slate-400">{template.description || "No description"}</p>
                        <p className="mt-2 text-sm text-forge-copper">{template.exercises.length} exercises</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => startTemplate(template)}>Start</Button>
                        <Button type="button" variant="secondary" onClick={() => editTemplate(template)}>Edit</Button>
                        <Button type="button" variant="ghost" onClick={() => deleteTemplate(template._id)}>Delete</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <EmptyState title="No templates yet" description="Create one or add a starter suggestion for your goal path." />
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
