import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import BodyweightCheckInCard from "../components/bodyweight/BodyweightCheckInCard.jsx";
import BodyweightHistoryChart from "../components/bodyweight/BodyweightHistoryChart.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import SelectInput from "../components/SelectInput.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import DataReadinessCard from "../components/readiness/DataReadinessCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { userService } from "../services/userService.js";
import { bodyweightService } from "../services/bodyweightService.js";
import { helpText } from "../utils/helpText.js";
import { strengthStandardOptions } from "../utils/onboarding.js";
import { goalPaths } from "../utils/onboarding.js";

const formatDate = (date) =>
  date ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date)) : "Not completed";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    preferredUnits: user?.preferredUnits || "metric",
    selectedStrengthStandard: user?.selectedStrengthStandard || "neutral",
    trainingExperience: user?.trainingExperience || "Beginner",
    goalPath: user?.goalPath || "",
    overloadMode: user?.overloadMode || "Balanced",
    bodyweight: user?.bodyweight || "",
    bodyweightCheckInReminderEnabled: user?.bodyweightCheckInReminderEnabled !== false,
    beginnerTipsEnabled: user?.beginnerTipsEnabled !== false
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [bodyweightData, setBodyweightData] = useState({ entries: [], latest: null });

  useEffect(() => {
    userService.getDataReadiness().then((data) => setReadiness(data.readiness)).catch(() => setReadiness(null));
    Promise.all([bodyweightService.getHistory(), bodyweightService.getLatest()])
      .then(([history, latest]) => setBodyweightData({ entries: history.entries || [], latest }))
      .catch(() => setBodyweightData({ entries: [], latest: null }));
  }, []);

  const handleBodyweightSave = async (payload) => {
    const latest = await bodyweightService.addEntry(payload);
    const history = await bodyweightService.getHistory();
    setBodyweightData({ entries: history.entries || [], latest });
    setForm((current) => ({ ...current, bodyweight: latest.currentBodyweight || payload.weight }));
  };

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
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Profile</p>
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
            <FormInput
              label="Current bodyweight"
              min="1"
              type="number"
              value={form.bodyweight}
              onChange={(event) => setForm({ ...form, bodyweight: event.target.value })}
            />
            <SelectInput
              label="Strength standard"
              options={strengthStandardOptions}
              value={form.selectedStrengthStandard}
              onChange={(event) => setForm({ ...form, selectedStrengthStandard: event.target.value })}
            />
            <p className="text-sm leading-6 text-slate-400 md:col-span-2">
              Strength standards are used only for fair bodyweight-ratio rank calculations. You can choose the
              standard that best fits how you want ForgeLift to calculate ranks.
            </p>
            <SelectInput
              label="Training experience"
              options={[
                { value: "Beginner", label: "Beginner" },
                { value: "Intermediate", label: "Intermediate" },
                { value: "Advanced", label: "Advanced" }
              ]}
              value={form.trainingExperience}
              onChange={(event) => setForm({ ...form, trainingExperience: event.target.value })}
            />
            <SelectInput
              label="Goal path"
              options={goalPaths.map((goal) => ({ value: goal.name, label: goal.name }))}
              value={form.goalPath}
              onChange={(event) => setForm({ ...form, goalPath: event.target.value })}
            />
            <SelectInput
              label="Overload mode"
              options={[
                { value: "Conservative", label: "Conservative" },
                { value: "Balanced", label: "Balanced" },
                { value: "Aggressive", label: "Aggressive" }
              ]}
              value={form.overloadMode}
              onChange={(event) => setForm({ ...form, overloadMode: event.target.value })}
            />
            <p className="text-sm leading-6 text-slate-400 md:col-span-2">
              Overload mode controls how quickly ForgeLift recommends weight increases. Conservative repeats more
              often, Balanced uses normal rules, and Aggressive allows faster jumps when recovery and RPE support it.
            </p>
            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-4 md:col-span-2">
              <input
                checked={form.beginnerTipsEnabled}
                className="h-4 w-4 accent-forge-ember"
                type="checkbox"
                onChange={(event) => setForm({ ...form, beginnerTipsEnabled: event.target.checked })}
              />
              <span>
                <span className="flex items-center gap-2 font-semibold text-white">
                  Show beginner tips
                  <HelpTooltip
                    {...helpText.confidence}
                    title="Beginner Tips"
                    content="Beginner tips are larger explanation boxes for common training terms. Question mark icons remain available even when tips are off."
                  />
                </span>
                <span className="mt-1 block text-sm text-slate-400">
                  Hide larger education boxes if you already know the terms.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-4 md:col-span-2">
              <input
                checked={form.bodyweightCheckInReminderEnabled}
                className="h-4 w-4 accent-forge-ember"
                type="checkbox"
                onChange={(event) => setForm({ ...form, bodyweightCheckInReminderEnabled: event.target.checked })}
              />
              <span>
                <span className="font-semibold text-white">Weekly bodyweight reminder</span>
                <span className="mt-1 block text-sm text-slate-400">
                  Prompt me weekly so bodyweight exercises and strength ratios stay accurate.
                </span>
              </span>
            </label>
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
              <dt className="text-slate-400">Overload mode</dt>
              <dd className="text-right text-white">{user?.overloadMode || "Balanced"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Beginner tips</dt>
              <dd className="text-right text-white">{user?.beginnerTipsEnabled === false ? "Hidden" : "Shown"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Onboarding</dt>
              <dd className="text-right text-white">{user?.onboardingCompleted ? "Complete" : "Incomplete"}</dd>
            </div>
          </dl>
          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-bold text-white">ForgeLift Assessment</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Retake the assessment any time to update your estimated training level, goal path, and strength
              baselines.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Status</dt>
                <dd className="text-right text-white">{user?.assessmentCompleted ? "Complete" : "Not completed"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Level</dt>
                <dd className="text-right text-white">{user?.assessmentSummary?.determinedLevel || user?.trainingExperience || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Confidence</dt>
                <dd className="text-right text-white">{user?.assessmentSummary?.confidence || "Low"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Last completed</dt>
                <dd className="text-right text-white">{formatDate(user?.assessmentCompletedAt)}</dd>
              </div>
            </dl>
            {user?.assessmentSummary?.recommendationSummary ? (
              <p className="mt-3 rounded-md bg-white/5 p-3 text-sm leading-6 text-slate-300">
                {user.assessmentSummary.recommendationSummary}
              </p>
            ) : null}
            <Link
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              to="/assessment"
            >
              {user?.assessmentCompleted ? "Retake Assessment" : "Start Assessment"}
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-bold text-white">Bodyweight Tracking</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Current bodyweight: {bodyweightData.latest?.currentBodyweight || user?.bodyweight || "Not set"}{" "}
              {user?.preferredUnits === "imperial" ? "lb" : "kg"}
            </p>
            <div className="mt-4 space-y-4">
              <BodyweightCheckInCard
                currentBodyweight={bodyweightData.latest?.currentBodyweight || user?.bodyweight}
                due={bodyweightData.latest?.isCheckInDue}
                unit={user?.preferredUnits === "imperial" ? "lb" : "kg"}
                onSave={handleBodyweightSave}
              />
              <BodyweightHistoryChart entries={bodyweightData.entries} />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-bold text-white">Strength Baselines</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter your known main lift numbers and ForgeLift will estimate conservative starting points for
              related exercises.
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              to="/strength-baselines"
            >
              Open Strength Baselines
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-red-400/20 bg-red-500/10 p-4">
            <h3 className="font-bold text-white">Data Management</h3>
            <p className="mt-2 text-sm leading-6 text-red-100">
              Reset your training history, delete logs from a selected period, or clear strength baselines. Your
              account and profile stay.
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
              to="/data-management"
            >
              Open Data Management
            </Link>
          </div>
          <div className="mt-6">
            <DataReadinessCard readiness={readiness} />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;
