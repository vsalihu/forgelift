import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import SelectInput from "../components/SelectInput.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";
import {
  genderOptions,
  getDefaultStrengthStandard,
  getSuggestedMeasurements,
  goalPaths,
  strengthStandardOptions
} from "../utils/onboarding.js";

const OnboardingPage = () => {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    gender: "",
    customGenderLabel: "",
    selectedStrengthStandard: "",
    age: "",
    height: "",
    bodyweight: "",
    preferredUnits: "metric",
    trainingExperience: "",
    goalPath: "",
    bodyMeasurements: {}
  });

  const measurementFields = useMemo(() => getSuggestedMeasurements(form.gender), [form.gender]);

  useEffect(() => {
    if (!form.gender) return;
    setForm((current) => ({
      ...current,
      selectedStrengthStandard:
        current.gender === "custom" ? current.selectedStrengthStandard : getDefaultStrengthStandard(current.gender)
    }));
  }, [form.gender]);

  const updateMeasurement = (field, value) => {
    setForm({
      ...form,
      bodyMeasurements: {
        ...form.bodyMeasurements,
        [field]: value
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await completeOnboarding(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Onboarding</p>
          <h1 className="mt-2 text-3xl font-black text-white">Build your profile foundation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            These choices set defaults and suggestions only. You can adjust standards and measurements as
            your training context changes.
          </p>
        </div>

        {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="metal-panel rounded-lg p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Identity and standards</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput
                label="Gender"
                options={genderOptions}
                value={form.gender}
                onChange={(event) => {
                  const gender = event.target.value;
                  setForm({
                    ...form,
                    gender,
                    customGenderLabel: gender === "custom" ? form.customGenderLabel : "",
                    selectedStrengthStandard:
                      gender === "custom" ? form.selectedStrengthStandard : getDefaultStrengthStandard(gender)
                  });
                }}
                required
              />
              <SelectInput
                label="Selected strength standard"
                options={strengthStandardOptions}
                value={form.selectedStrengthStandard}
                onChange={(event) => setForm({ ...form, selectedStrengthStandard: event.target.value })}
                disabled={form.gender && form.gender !== "custom"}
                required
              />
              {form.gender === "custom" ? (
                <FormInput
                  label="Custom gender label"
                  value={form.customGenderLabel}
                  onChange={(event) => setForm({ ...form, customGenderLabel: event.target.value })}
                  required
                />
              ) : null}
            </div>
          </section>

          <section className="metal-panel rounded-lg p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Training profile</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Age"
                type="number"
                min="1"
                value={form.age}
                onChange={(event) => setForm({ ...form, age: event.target.value })}
                required
              />
              <FormInput
                label={form.preferredUnits === "imperial" ? "Height (in)" : "Height (cm)"}
                type="number"
                min="1"
                value={form.height}
                onChange={(event) => setForm({ ...form, height: event.target.value })}
                required
              />
              <FormInput
                label={form.preferredUnits === "imperial" ? "Bodyweight (lb)" : "Bodyweight (kg)"}
                type="number"
                min="1"
                value={form.bodyweight}
                onChange={(event) => setForm({ ...form, bodyweight: event.target.value })}
                required
              />
              <SelectInput
                label="Preferred units"
                options={[
                  { value: "metric", label: "kg/cm" },
                  { value: "imperial", label: "lb/in" }
                ]}
                value={form.preferredUnits}
                onChange={(event) => setForm({ ...form, preferredUnits: event.target.value })}
                required
              />
              <SelectInput
                label="Training experience"
                options={[
                  { value: "Beginner", label: "Beginner" },
                  { value: "Intermediate", label: "Intermediate" },
                  { value: "Advanced", label: "Advanced" }
                ]}
                value={form.trainingExperience}
                onChange={(event) => setForm({ ...form, trainingExperience: event.target.value })}
                required
              />
            </div>
          </section>

          <section className="metal-panel rounded-lg p-5">
            <h2 className="mb-5 text-xl font-bold text-white">Goal path</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {goalPaths.map((goal) => (
                <label
                  className={`cursor-pointer rounded-lg border p-4 transition ${
                    form.goalPath === goal.name
                      ? "border-forge-ember bg-forge-ember/10"
                      : "border-white/10 bg-black/20 hover:border-white/25"
                  }`}
                  key={goal.name}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="goalPath"
                    value={goal.name}
                    checked={form.goalPath === goal.name}
                    onChange={(event) => setForm({ ...form, goalPath: event.target.value })}
                    required
                  />
                  <span className="block font-bold text-white">{goal.name}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-400">{goal.description}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="metal-panel rounded-lg p-5">
            <h2 className="text-xl font-bold text-white">Optional body measurements</h2>
            <p className="mb-5 mt-2 text-sm text-slate-400">
              Suggested fields adapt to your onboarding selection and can be skipped.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {measurementFields.map((field) => (
                <FormInput
                  key={field}
                  label={`${field.charAt(0).toUpperCase()}${field.slice(1)} (${form.preferredUnits === "imperial" ? "in" : "cm"})`}
                  type="number"
                  min="0"
                  value={form.bodyMeasurements[field] || ""}
                  onChange={(event) => updateMeasurement(field, event.target.value)}
                />
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <Button className="w-full sm:w-auto" loading={submitting} type="submit">
              Complete onboarding
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default OnboardingPage;
