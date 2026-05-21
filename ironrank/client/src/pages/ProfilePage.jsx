import { useState } from "react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import SelectInput from "../components/SelectInput.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { strengthStandardOptions } from "../utils/onboarding.js";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    preferredUnits: user?.preferredUnits || "metric",
    selectedStrengthStandard: user?.selectedStrengthStandard || "neutral"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await updateProfile(form);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-iron-copper">Profile</p>
        <h1 className="mt-2 text-3xl font-black text-white">Your profile</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <form className="metal-panel rounded-lg p-5" onSubmit={handleSubmit}>
          {message ? <div className="mb-5 rounded-md bg-green-500/10 p-3 text-sm text-green-200">{message}</div> : null}
          {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
            />
            <SelectInput
              label="Strength standard"
              options={strengthStandardOptions}
              value={form.selectedStrengthStandard}
              onChange={(event) => setForm({ ...form, selectedStrengthStandard: event.target.value })}
            />
          </div>
          <Button className="mt-6" loading={saving} type="submit">
            Save profile
          </Button>
        </form>

        <section className="metal-panel rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Stored profile data</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Email</dt>
              <dd className="text-right text-white">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Goal path</dt>
              <dd className="text-right text-white">{user?.goalPath}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Experience</dt>
              <dd className="text-right text-white">{user?.trainingExperience}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Onboarding</dt>
              <dd className="text-right text-white">{user?.onboardingCompleted ? "Complete" : "Incomplete"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;
