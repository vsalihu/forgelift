import { useEffect, useMemo, useState } from "react";
import Button from "../Button.jsx";
import FormInput from "../FormInput.jsx";
import BottomSheet from "../ui/BottomSheet.jsx";
import FilterChipGroup from "../ui/FilterChipGroup.jsx";
import CustomSelect from "../ui/CustomSelect.jsx";
import { MUSCLE_TAXONOMY } from "../../utils/muscleTaxonomy.js";

const categories = Object.keys(MUSCLE_TAXONOMY);
const typeOptions = ["compound", "isolation", "machine", "bodyweight", "cardio"].map((value) => ({ value, label: value }));
const difficultyOptions = ["Beginner", "Intermediate", "Advanced"].map((value) => ({ value, label: value }));
const allMuscles = [...new Set([...categories, ...Object.values(MUSCLE_TAXONOMY).flat()])];

const defaultForm = {
  name: "",
  category: "Arms",
  exerciseType: "compound",
  equipment: "",
  difficulty: "Beginner",
  movementPattern: "",
  mainMuscleGroups: ["Arms"],
  primaryMuscles: [],
  secondaryMuscles: [],
  stabiliserMuscles: [],
  impactProfile: {},
  instructions: "",
  defaultRepMin: 8,
  defaultRepMax: 12
};

const CustomExerciseForm = ({ open, initialExercise, loading, onClose, onSave }) => {
  const [form, setForm] = useState(initialExercise || defaultForm);
  const [error, setError] = useState("");
  const selectedMuscles = useMemo(
    () => [...new Set([...(form.primaryMuscles || []), ...(form.secondaryMuscles || []), ...(form.stabiliserMuscles || [])])],
    [form.primaryMuscles, form.secondaryMuscles, form.stabiliserMuscles]
  );

  useEffect(() => {
    if (open) {
      setForm(initialExercise || defaultForm);
      setError("");
    }
  }, [initialExercise, open]);

  const toggleArrayValue = (key, value) => {
    const current = form[key] || [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    const nextImpact = { ...(form.impactProfile || {}) };

    if (!current.includes(value)) {
      nextImpact[value] = key === "primaryMuscles" ? 100 : key === "secondaryMuscles" ? 40 : 15;
    }

    setForm({ ...form, [key]: next, impactProfile: nextImpact });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Exercise name is required.");
    if (!form.primaryMuscles.length) return setError("Choose at least one primary muscle.");

    await onSave({
      ...form,
      mainMuscleGroups: form.mainMuscleGroups.length ? form.mainMuscleGroups : [form.category].filter(Boolean),
      detailedMuscles: selectedMuscles.filter((muscle) => !categories.includes(muscle))
    });
    setForm(defaultForm);
  };

  return (
    <BottomSheet open={open} title={initialExercise ? "Edit Custom Exercise" : "Create Custom Exercise"} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

        <section className="space-y-3">
          <h3 className="font-black text-white">Basic info</h3>
          <FormInput label="Exercise name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              label="Category"
              options={categories.map((value) => ({ value, label: value }))}
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value, mainMuscleGroups: [event.target.value] })}
            />
            <CustomSelect label="Type" options={typeOptions} value={form.exerciseType} onChange={(event) => setForm({ ...form, exerciseType: event.target.value })} />
            <FormInput label="Equipment" value={form.equipment} onChange={(event) => setForm({ ...form, equipment: event.target.value })} />
            <CustomSelect label="Difficulty" options={difficultyOptions} value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-black text-white">Muscle targeting</h3>
          <p className="text-sm text-slate-400">Choose the muscles this movement trains. Primary muscles default to 100%, secondary to 40%, stabilisers to 15%.</p>
          {[
            ["primaryMuscles", "Primary"],
            ["secondaryMuscles", "Secondary"],
            ["stabiliserMuscles", "Stabiliser"]
          ].map(([key, label]) => (
            <div key={key}>
              <p className="mb-2 text-sm font-bold text-slate-300">{label}</p>
              <FilterChipGroup
                items={allMuscles.map((muscle) => ({ value: muscle, label: muscle }))}
                value=""
                onChange={(muscle) => toggleArrayValue(key, muscle)}
              />
              <div className="flex flex-wrap gap-2">
                {(form[key] || []).map((muscle) => (
                  <button className="rounded-full bg-forge-ember/15 px-3 py-1 text-xs font-bold text-orange-100" key={muscle} type="button" onClick={() => toggleArrayValue(key, muscle)}>
                    {muscle} x
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {selectedMuscles.length ? (
          <section className="space-y-3">
            <h3 className="font-black text-white">Impact percentages</h3>
            {selectedMuscles.map((muscle) => (
              <label className="block" key={muscle}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-slate-300">{muscle}</span>
                  <span className="text-slate-400">{form.impactProfile?.[muscle] || 0}%</span>
                </div>
                <input
                  className="w-full accent-forge-ember"
                  max="100"
                  min="0"
                  type="range"
                  value={form.impactProfile?.[muscle] || 0}
                  onChange={(event) => setForm({ ...form, impactProfile: { ...form.impactProfile, [muscle]: Number(event.target.value) } })}
                />
              </label>
            ))}
          </section>
        ) : null}

        <FormInput label="Instructions or notes" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full" loading={loading} type="submit">
            Save Custom Exercise
          </Button>
          <Button className="w-full" type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default CustomExerciseForm;
