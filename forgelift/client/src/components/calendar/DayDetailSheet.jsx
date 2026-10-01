import { ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomSheet from "../ui/BottomSheet.jsx";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import { PhysioIcon, RestDayIcon } from "../icons/featureIcons.jsx";
import { DumbbellIcon, GymModeIcon } from "../icons/navIcons.jsx";
import { calendarService } from "../../services/calendarService.js";
import { workoutTemplateService } from "../../services/workoutTemplateService.js";
import { gymDraftInProgress, startInGymMode } from "../../utils/gymHandoff.js";
import { keyToLocalDate, todayKey } from "./calendarUtils.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const formatDateLabel = (key) => keyToLocalDate(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const TYPES = [
  { value: "planned_workout", label: "Workout", icon: DumbbellIcon },
  { value: "rest", label: "Rest", icon: RestDayIcon },
  { value: "treatment", label: "Treatment", icon: PhysioIcon }
];

const tile = (selected) =>
  `rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    selected ? "border-forge-ember/70 bg-forge-ember/[0.12] text-white" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25"
  }`;

// The workout a planned day would start in Gym Mode, if it has exercises.
const plannedTemplate = (entry) => {
  if (!entry || entry.type !== "planned_workout") return null;
  const template = entry.workoutTemplateId;
  if (template?.exercises?.length) return { name: template.name, description: "", exercises: template.exercises };
  if (entry.plannedExercises?.length) return { name: entry.plannedTitle || "Planned workout", description: "", exercises: entry.plannedExercises };
  return null;
};

const DayDetailSheet = ({ date, dayData, onClose, onSaved }) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [type, setType] = useState("planned_workout");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [freeformTitle, setFreeformTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStart, setConfirmStart] = useState(null);
  const [error, setError] = useState("");

  const entry = dayData?.entry;
  const workouts = dayData?.workouts || [];

  useEffect(() => {
    if (!date) return;
    setError("");
    setType(entry?.type || "planned_workout");
    setNotes(entry?.notes || "");
    setTemplateId(entry?.workoutTemplateId?._id || "");
    setFreeformTitle(entry?.plannedTitle || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    workoutTemplateService
      .getTemplates()
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  if (!date) return null;

  const isGenerated = entry?.source === "generated";
  const startable = date >= todayKey() ? plannedTemplate(entry) : null;

  const start = (template) => {
    if (gymDraftInProgress()) {
      setConfirmStart(template);
      return;
    }
    startInGymMode(template, navigate);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await calendarService.upsertEntry({
        date: `${date}T00:00:00.000Z`,
        type,
        notes,
        workoutTemplateId: type === "planned_workout" ? templateId || undefined : undefined,
        plannedTitle: type === "planned_workout" && !templateId ? freeformTitle : undefined
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?._id) return;
    setDeleting(true);
    setError("");
    try {
      await calendarService.deleteEntry(entry._id);
      setConfirmDelete(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BottomSheet open={Boolean(date)} title={formatDateLabel(date)} onClose={onClose}>
      {confirmDelete ? (
        <ConfirmModal confirmLabel="Clear day" description="This removes what's planned for this day." loading={deleting} title="Clear this day?" onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
      ) : null}
      {confirmStart ? (
        <ConfirmModal
          cancelLabel="Keep my workout"
          confirmLabel="Start this one"
          description="You have a Gym Mode workout in progress. Starting this plan replaces it."
          title="Replace your workout in progress?"
          tone="primary"
          onCancel={() => setConfirmStart(null)}
          onConfirm={() => startInGymMode(confirmStart, navigate)}
        />
      ) : null}

      {error ? (
        <p className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      {workouts.length ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Done</h3>
          <ul className="space-y-2">
            {workouts.map((workout) => (
              <li key={workout._id}>
                <Link className="flex items-center gap-3 rounded-2xl border border-forge-ember/25 bg-forge-ember/[0.07] p-4 hover:bg-forge-ember/[0.12]" to={`/workouts/${workout._id}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forge-ember text-[#160a02]">
                    <DumbbellIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-white">{workout.title}</span>
                    <span className="block text-sm tabular-nums text-zinc-400">
                      {formatNumber(workout.totalVolume)}kg · {workout.totalSets} sets
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="h-5 w-5 text-zinc-500" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <form className="space-y-5" onSubmit={handleSave}>
          {startable ? (
            <div className="rounded-2xl border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.12] to-transparent p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">
                {isGenerated ? "From your plan" : "Planned"}
                {entry?.isDeloadWeek ? " · deload week" : ""}
              </p>
              <p className="font-display mt-1 text-xl text-white">{startable.name}</p>
              {entry?.muscleGroups?.length ? <p className="mt-0.5 text-sm text-zinc-400">{entry.muscleGroups.join(" · ")}</p> : null}
              <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                {startable.exercises.slice(0, 6).map((exercise) => (
                  <li className="flex justify-between gap-3" key={exercise.exerciseName}>
                    <span className="truncate">{exercise.exerciseName}</span>
                    <span className="shrink-0 tabular-nums text-zinc-500">
                      {exercise.targetSets || 3} × {exercise.targetRepMin && exercise.targetRepMax ? `${exercise.targetRepMin}-${exercise.targetRepMax}` : "reps"}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02]"
                type="button"
                onClick={() => start(startable)}
              >
                <GymModeIcon className="h-4 w-4" />
                Start in Gym Mode
              </button>
            </div>
          ) : null}

          {isGenerated ? <p className="text-sm text-zinc-500">Changing this day below replaces the plan's choice with yours.</p> : null}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-200">This day is</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {TYPES.map((option) => {
                const Icon = option.icon;
                return (
                  <button aria-checked={type === option.value} className={`${tile(type === option.value)} flex flex-col items-center gap-1.5 py-3.5`} key={option.value} role="radio" type="button" onClick={() => setType(option.value)}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-bold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {type === "planned_workout" ? (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-200">Which workout?</legend>
              {templates.length ? (
                <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="radiogroup">
                  <button aria-checked={!templateId} className={tile(!templateId)} role="radio" type="button" onClick={() => setTemplateId("")}>
                    <span className="block text-sm font-bold">My own</span>
                    <span className="block text-xs text-zinc-500">Name it below</span>
                  </button>
                  {templates.map((template) => (
                    <button
                      aria-checked={templateId === template._id}
                      className={tile(templateId === template._id)}
                      key={template._id}
                      role="radio"
                      type="button"
                      onClick={() => {
                        setTemplateId(template._id);
                        setFreeformTitle("");
                      }}
                    >
                      <span className="block truncate text-sm font-bold">{template.name}</span>
                      <span className="block text-xs text-zinc-500">{template.exercises?.length || 0} exercises</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {!templateId ? (
                <label className="mt-3 block">
                  <span className="sr-only">Workout name</span>
                  <input
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
                    placeholder="Name it, e.g. Push day"
                    value={freeformTitle}
                    onChange={(event) => setFreeformTitle(event.target.value)}
                  />
                </label>
              ) : null}
            </fieldset>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-zinc-200">Notes</span>
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
              placeholder={type === "treatment" ? "Physio, massage, mobility…" : "Anything to remember"}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <button
              className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-sm font-bold text-white hover:bg-white/[0.1] disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving…" : entry ? "Save changes" : "Plan this day"}
            </button>
            {entry ? (
              <button
                aria-label="Clear this day"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:border-red-400/30 hover:text-red-300"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      )}
    </BottomSheet>
  );
};

export default DayDetailSheet;
