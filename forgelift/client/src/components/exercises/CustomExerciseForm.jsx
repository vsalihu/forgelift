import { useEffect, useId, useMemo, useState } from "react";
import BottomSheet from "../ui/BottomSheet.jsx";
import { MUSCLE_TAXONOMY } from "../../utils/muscleTaxonomy.js";
import { ROLES, titleCase } from "./exerciseMeta.js";
import { cleanInteger } from "../gym/gymUtils.js";

const categories = Object.keys(MUSCLE_TAXONOMY);
const TYPES = ["compound", "isolation", "machine", "bodyweight", "cardio"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const EQUIPMENT = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "smith machine", "kettlebell", "band"];
const ROLE_KEYS = { primary: "primaryMuscles", secondary: "secondaryMuscles", stabiliser: "stabiliserMuscles" };
const DEFAULT_IMPACT = { primary: 100, secondary: 40, stabiliser: 15 };

const defaultForm = {
  name: "",
  category: "Chest",
  exerciseType: "compound",
  equipment: "",
  difficulty: "Beginner",
  movementPattern: "",
  mainMuscleGroups: ["Chest"],
  primaryMuscles: [],
  secondaryMuscles: [],
  stabiliserMuscles: [],
  impactProfile: {},
  instructions: "",
  defaultRepMin: 8,
  defaultRepMax: 12
};

const inputClass =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-forge-ember/60";

const Chip = ({ active, children, onClick, ...rest }) => (
  <button
    aria-pressed={active}
    className={`min-h-10 rounded-full border px-3.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
      active ? "border-transparent bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
    }`}
    type="button"
    onClick={onClick}
    {...rest}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children }) => (
  <div>
    <p className="mb-2 text-sm font-semibold text-zinc-200">{label}</p>
    {children}
    {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
  </div>
);

const roleOfMuscle = (form, muscle) => Object.keys(ROLE_KEYS).find((role) => (form[ROLE_KEYS[role]] || []).includes(muscle));

const CustomExerciseForm = ({ open, initialExercise, loading, onClose, onSave }) => {
  const nameId = useId();
  const [form, setForm] = useState(initialExercise || defaultForm);
  const [activeRole, setActiveRole] = useState("primary");
  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const [error, setError] = useState("");

  const selectedMuscles = useMemo(
    () => [...new Set([...(form.primaryMuscles || []), ...(form.secondaryMuscles || []), ...(form.stabiliserMuscles || [])])],
    [form.primaryMuscles, form.secondaryMuscles, form.stabiliserMuscles]
  );

  useEffect(() => {
    if (open) {
      setForm(
        initialExercise
          ? {
              ...defaultForm,
              ...initialExercise,
              mainMuscleGroups: initialExercise.mainMuscleGroups?.length ? initialExercise.mainMuscleGroups : [initialExercise.category].filter(Boolean)
            }
          : defaultForm
      );
      setActiveRole("primary");
      setShowAllMuscles(false);
      setError("");
    }
  }, [initialExercise, open]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const toggleMuscle = (muscle) => {
    setForm((current) => {
      const currentRole = roleOfMuscle(current, muscle);
      const next = { ...current, impactProfile: { ...(current.impactProfile || {}) } };
      if (currentRole) next[ROLE_KEYS[currentRole]] = (current[ROLE_KEYS[currentRole]] || []).filter((item) => item !== muscle);
      if (currentRole === activeRole) {
        delete next.impactProfile[muscle];
      } else {
        next[ROLE_KEYS[activeRole]] = [...(next[ROLE_KEYS[activeRole]] || []), muscle];
        next.impactProfile[muscle] = DEFAULT_IMPACT[activeRole];
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Give the exercise a name.");
    if (!form.primaryMuscles.length) return setError("Pick at least one primary muscle.");
    const repMin = Number(form.defaultRepMin) || 8;
    const repMax = Number(form.defaultRepMax) || 12;
    if (repMin > repMax) return setError("The rep range starts higher than it ends.");

    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        defaultRepMin: repMin,
        defaultRepMax: repMax,
        mainMuscleGroups: form.mainMuscleGroups?.length ? form.mainMuscleGroups : [form.category].filter(Boolean),
        detailedMuscles: selectedMuscles.filter((muscle) => !categories.includes(muscle))
      });
      setForm(defaultForm);
    } catch (err) {
      setError(err.message || "Couldn't save this exercise.");
    }
  };

  const muscleGroups = showAllMuscles ? categories : [form.category];

  return (
    <BottomSheet open={open} title={initialExercise ? "Edit exercise" : "Create an exercise"} onClose={onClose}>
      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-zinc-200" htmlFor={nameId}>
            Name
          </label>
          <input autoComplete="off" className={inputClass} id={nameId} maxLength={80} placeholder="Landmine Press" value={form.name} onChange={(event) => set({ name: event.target.value })} />
        </div>

        <Field label="Muscle group">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Chip active={form.category === category} key={category} onClick={() => set({ category, mainMuscleGroups: [category] })}>
                {category}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Type">
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <Chip active={form.exerciseType === type} key={type} onClick={() => set({ exerciseType: type })}>
                  {titleCase(type)}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Level">
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <Chip active={form.difficulty === difficulty} key={difficulty} onClick={() => set({ difficulty })}>
                  {difficulty}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-zinc-200">Equipment</span>
            <input className={inputClass} list="custom-exercise-equipment" placeholder="Barbell" value={form.equipment} onChange={(event) => set({ equipment: event.target.value })} />
            <datalist id="custom-exercise-equipment">
              {EQUIPMENT.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-zinc-200">Rep range</legend>
            <div className="flex items-center gap-2">
              <input
                aria-label="Lowest reps"
                className={`${inputClass} text-center tabular-nums`}
                inputMode="numeric"
                value={form.defaultRepMin}
                onChange={(event) => set({ defaultRepMin: cleanInteger(event.target.value) })}
              />
              <span className="text-zinc-500">to</span>
              <input
                aria-label="Highest reps"
                className={`${inputClass} text-center tabular-nums`}
                inputMode="numeric"
                value={form.defaultRepMax}
                onChange={(event) => set({ defaultRepMax: cleanInteger(event.target.value) })}
              />
            </div>
          </fieldset>
        </div>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h3 className="font-display text-lg text-white">Muscles it trains</h3>
          <p className="mt-1 text-sm text-zinc-400">Choose a role, then tap the muscles. Tap again to remove.</p>
          <div aria-label="Adding as" className="mt-3 grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup">
            {Object.entries(ROLES).map(([role, meta]) => (
              <button
                aria-checked={activeRole === role}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  activeRole === role ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-white"
                }`}
                key={role}
                role="radio"
                type="button"
                onClick={() => setActiveRole(role)}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {muscleGroups.map((group) => (
              <div key={group}>
                {showAllMuscles ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{group}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {[group, ...MUSCLE_TAXONOMY[group].filter((muscle) => muscle !== group)].map((muscle) => {
                    const role = roleOfMuscle(form, muscle);
                    return (
                      <button
                        aria-pressed={Boolean(role)}
                        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                          role ? "bg-white/[0.08] text-white" : "border-white/10 bg-transparent text-zinc-400 hover:border-white/25 hover:text-white"
                        }`}
                        key={`${group}-${muscle}`}
                        style={role ? { borderColor: ROLES[role].color } : undefined}
                        type="button"
                        onClick={() => toggleMuscle(muscle)}
                      >
                        {role ? <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLES[role].color }} /> : null}
                        {muscle}
                        {role ? <span className="text-xs text-zinc-400">{ROLES[role].label}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-sm font-semibold text-orange-300 hover:text-orange-200" type="button" onClick={() => setShowAllMuscles((value) => !value)}>
            {showAllMuscles ? `Only show ${form.category}` : "Show every muscle group"}
          </button>

          {selectedMuscles.length ? (
            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
              <p className="text-sm font-semibold text-zinc-200">How hard it hits each one</p>
              {selectedMuscles.map((muscle) => {
                const role = roleOfMuscle(form, muscle) || "secondary";
                const value = form.impactProfile?.[muscle] || 0;
                return (
                  <label className="block" key={muscle}>
                    <span className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-zinc-300">{muscle}</span>
                      <span className="tabular-nums text-zinc-400">{value}%</span>
                    </span>
                    <input
                      className="w-full"
                      max="100"
                      min="0"
                      step="5"
                      style={{ accentColor: ROLES[role].color }}
                      type="range"
                      value={value}
                      onChange={(event) => set({ impactProfile: { ...form.impactProfile, [muscle]: Number(event.target.value) } })}
                    />
                  </label>
                );
              })}
            </div>
          ) : null}
        </section>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-zinc-200">Notes (optional)</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-forge-ember/60"
            placeholder="Setup cues, grip, tempo..."
            value={form.instructions}
            onChange={(event) => set({ instructions: event.target.value })}
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="min-h-12 rounded-full border border-white/12 bg-white/[0.05] px-6 text-sm font-bold text-white hover:bg-white/[0.09]" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="min-h-12 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Saving..." : initialExercise ? "Save changes" : "Save exercise"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default CustomExerciseForm;
