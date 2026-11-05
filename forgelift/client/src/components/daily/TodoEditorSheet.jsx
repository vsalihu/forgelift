import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import BottomSheet from "../ui/BottomSheet.jsx";
import { REPEATS, SUGGESTIONS, TODO_COLORS, TODO_ICONS, WEEKDAYS, formatCount, repeatLabel } from "./customTodoMeta.js";

const BLANK = { label: "", kind: "check", target: 1, unit: "", repeat: "daily", days: [1, 2, 3, 4, 5], icon: "check", color: "ember" };

const pill = (active) =>
  `min-h-11 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    active ? "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
  }`;
const input = "min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60";

export const TodoTile = ({ icon, color, size = "md" }) => {
  const [Icon] = TODO_ICONS[icon] || TODO_ICONS.check;
  const tone = TODO_COLORS[color] || TODO_COLORS.ember;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl border ${tone.tile} ${size === "sm" ? "h-9 w-9" : "h-11 w-11"}`}>
      <Icon aria-hidden="true" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
};

// Create or edit one of the user's own to-dos. existing: the to-do being edited, or null for a new one.
const TodoEditorSheet = ({ open, existing, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState({ message: "", field: "" });

  useEffect(() => {
    if (!open) return;
    setForm(existing ? { ...BLANK, ...existing, days: existing.days?.length ? existing.days : BLANK.days, target: existing.target || 1 } : BLANK);
    setSaving(false);
    setConfirmDelete(false);
    setError({ message: "", field: "" });
  }, [open, existing]);

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setError((current) => (current.message ? { message: "", field: "" } : current));
  };
  const toggleDay = (day) => set({ days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day] });

  const save = async () => {
    if (!form.label.trim()) return setError({ message: "Give the to-do a name.", field: "label" });
    if (form.kind === "count" && !(Number(form.target) >= 1)) return setError({ message: "Set a target of at least 1.", field: "target" });
    if (form.repeat === "days" && !form.days.length) return setError({ message: "Pick at least one day.", field: "days" });
    setSaving(true);
    setError({ message: "", field: "" });
    try {
      await onSave({
        label: form.label,
        kind: form.kind,
        target: form.kind === "count" ? Number(form.target) : 1,
        unit: form.kind === "count" ? form.unit : "",
        repeat: form.repeat,
        days: form.repeat === "days" ? form.days : [],
        icon: form.icon,
        color: form.color
      });
    } catch (err) {
      setError({ message: err.message, field: err.field || "" });
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    try {
      await onDelete();
    } catch (err) {
      setError({ message: err.message, field: "" });
      setSaving(false);
    }
  };

  const tone = TODO_COLORS[form.color] || TODO_COLORS.ember;

  return (
    <BottomSheet open={open} title={existing ? "Edit to-do" : "New to-do"} onClose={onClose}>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {/* Live preview */}
        <div aria-hidden="true" className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <TodoTile color={form.color} icon={form.icon} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-white">{form.label.trim() || "Your to-do"}</span>
            <span className="block truncate text-xs text-zinc-500">
              {form.kind === "count" ? `0 / ${formatCount(Number(form.target) || 0)}${form.unit ? ` ${form.unit}` : ""} · ` : ""}
              {repeatLabel(form)}
            </span>
            {form.kind === "count" ? (
              <span className="mt-1.5 block h-1.5 overflow-clip rounded-full bg-white/[0.07]">
                <span className={`block h-full w-1/3 rounded-full bg-gradient-to-r ${tone.bar}`} />
              </span>
            ) : null}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-zinc-500">
            {form.kind === "count" ? <Plus className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          </span>
        </div>

        {existing ? null : (
          <div>
            <p className="mb-2 text-sm font-semibold text-zinc-300">Ideas</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:border-orange-400/40 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  key={suggestion.label}
                  type="button"
                  onClick={() => set({ ...BLANK, ...suggestion, target: suggestion.target || 1 })}
                >
                  <Plus aria-hidden="true" className="h-3 w-3" />
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-300" htmlFor="todo-label">
            Name
          </label>
          <input
            aria-describedby={error.field === "label" ? "todo-error" : undefined}
            aria-invalid={error.field === "label"}
            className={input}
            id="todo-label"
            maxLength={60}
            placeholder="e.g. Stretch 10 min"
            value={form.label}
            onChange={(event) => set({ label: event.target.value })}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300" id="todo-kind">
            How do you finish it?
          </p>
          <div aria-labelledby="todo-kind" className="grid grid-cols-2 gap-2" role="group">
            <button aria-pressed={form.kind === "check"} className={pill(form.kind === "check")} type="button" onClick={() => set({ kind: "check" })}>
              Tick it off
            </button>
            <button aria-pressed={form.kind === "count"} className={pill(form.kind === "count")} type="button" onClick={() => set({ kind: "count", target: form.target > 1 ? form.target : 10 })}>
              Count to a target
            </button>
          </div>
          {form.kind === "count" ? (
            <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-zinc-400">Target</span>
                <input
                  aria-invalid={error.field === "target"}
                  className={input}
                  inputMode="numeric"
                  value={form.target}
                  onChange={(event) => set({ target: event.target.value.replace(/\D/g, "").slice(0, 6) })}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-zinc-400">Unit</span>
                <input className={input} maxLength={16} placeholder="steps, pages, min" value={form.unit} onChange={(event) => set({ unit: event.target.value })} />
              </label>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300" id="todo-repeat">
            When
          </p>
          <div aria-labelledby="todo-repeat" className="flex flex-wrap gap-1.5" role="group">
            {REPEATS.map(([key, label]) => (
              <button aria-pressed={form.repeat === key} className={pill(form.repeat === key)} key={key} type="button" onClick={() => set({ repeat: key })}>
                {label}
              </button>
            ))}
          </div>
          {form.repeat === "days" ? (
            <div aria-label="Days of the week" className="mt-3 grid grid-cols-7 gap-1" role="group">
              {WEEKDAYS.map(([day, letter, name]) => (
                <button aria-label={name} aria-pressed={form.days.includes(day)} className={`${pill(form.days.includes(day))} px-0`} key={day} type="button" onClick={() => toggleDay(day)}>
                  {letter}
                </button>
              ))}
            </div>
          ) : null}
          {form.repeat === "training" || form.repeat === "rest" ? (
            <p className="mt-2 text-xs text-zinc-500">Follows your check-in, logged workouts and calendar.</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300" id="todo-icon">
            Icon
          </p>
          <div aria-labelledby="todo-icon" className="grid grid-cols-6 gap-1.5" role="group">
            {Object.entries(TODO_ICONS).map(([key, [Icon, label]]) => (
              <button
                aria-label={`${label} icon`}
                aria-pressed={form.icon === key}
                className={`flex h-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  form.icon === key ? `${tone.tile} ring-1 ring-current` : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                }`}
                key={key}
                type="button"
                onClick={() => set({ icon: key })}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300" id="todo-color">
            Colour
          </p>
          <div aria-labelledby="todo-color" className="flex flex-wrap gap-2" role="group">
            {Object.entries(TODO_COLORS).map(([key, { label, swatch }]) => (
              <button
                aria-label={`${label} colour`}
                aria-pressed={form.color === key}
                className={`flex h-11 w-11 items-center justify-center rounded-full ${swatch} transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1014] ${
                  form.color === key ? "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-[#0e1014]" : "opacity-80 hover:opacity-100"
                }`}
                key={key}
                type="button"
                onClick={() => set({ color: key })}
              >
                {form.color === key ? <Check aria-hidden="true" className="h-5 w-5 text-[#0b0c0f]" strokeWidth={3} /> : null}
              </button>
            ))}
          </div>
        </div>

        {error.message ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-100" id="todo-error" role="alert">
            {error.message}
          </p>
        ) : null}

        <div className="flex gap-2">
          {existing ? (
            <button
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60 ${
                confirmDelete ? "bg-red-500/20 text-red-100" : "border border-red-400/25 text-red-200 hover:bg-red-500/10"
              }`}
              disabled={saving}
              type="button"
              onClick={remove}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {confirmDelete ? "Delete it" : "Delete"}
            </button>
          ) : null}
          <button className="min-h-12 flex-1 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60" disabled={saving} type="submit">
            {saving ? "Saving…" : existing ? "Save changes" : "Add to-do"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default TodoEditorSheet;
