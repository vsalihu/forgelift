import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Button from "../Button.jsx";
import FormInput from "../FormInput.jsx";
import SelectInput from "../SelectInput.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import { calendarService } from "../../services/calendarService.js";
import { workoutTemplateService } from "../../services/workoutTemplateService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
const formatDateLabel = (key) =>
  new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${key}T00:00:00Z`));

const typeOptions = [
  { value: "rest", label: "Rest day" },
  { value: "treatment", label: "Treatment (physio / massage / mobility)" },
  { value: "planned_workout", label: "Planned workout" }
];

const DayDetailSheet = ({ date, dayData, onClose, onSaved }) => {
  const [templates, setTemplates] = useState([]);
  const [type, setType] = useState("rest");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [freeformTitle, setFreeformTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const entry = dayData?.entry;
  const hasWorkouts = (dayData?.workouts || []).length > 0;

  useEffect(() => {
    if (!date) return;
    setError("");
    setType(entry?.type || "rest");
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
        <ConfirmModal
          title="Remove this day's plan?"
          description="This clears the assignment for this day."
          confirmLabel="Remove"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}

      {error ? <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {hasWorkouts ? (
        <div className="space-y-3">
          {dayData.workouts.map((workout) => (
            <Link
              className="block rounded-lg border border-white/10 bg-black/20 p-4 hover:bg-white/5"
              key={workout._id}
              to={`/workouts/${workout._id}`}
            >
              <p className="font-bold text-white">{workout.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {formatNumber(workout.totalVolume)}kg volume · {workout.totalSets} sets
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSave}>
          {isGenerated ? (
            <p className="rounded-md bg-forge-ember/10 p-3 text-xs font-semibold text-orange-200">
              AI-planned day{entry?.isDeloadWeek ? " · deload week" : ""}. Saving below replaces it with your own choice.
            </p>
          ) : null}

          <SelectInput label="Type" options={typeOptions} value={type} onChange={(event) => setType(event.target.value)} />

          {type === "planned_workout" ? (
            <>
              <SelectInput
                label="Use a saved workout (optional)"
                options={templates.map((template) => ({ value: template._id, label: template.name }))}
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value);
                  if (event.target.value) setFreeformTitle("");
                }}
              />
              {!templateId ? (
                <FormInput
                  label="Or name this workout"
                  placeholder="Push day"
                  value={freeformTitle}
                  onChange={(event) => setFreeformTitle(event.target.value)}
                />
              ) : null}
            </>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Notes</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-forge-ember focus:ring-2 focus:ring-forge-ember/20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <Button className="flex-1" loading={saving} type="submit">
              {entry ? "Update day" : "Assign day"}
            </Button>
            {entry ? (
              <Button disabled={deleting} type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </BottomSheet>
  );
};

export default DayDetailSheet;
