import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { ChoiceGrid, Segmented } from "../components/auth/Choices.jsx";
import BodyweightCheckInCard from "../components/bodyweight/BodyweightCheckInCard.jsx";
import BodyweightHistoryChart from "../components/bodyweight/BodyweightHistoryChart.jsx";
import CitySearch from "../components/compete/CitySearch.jsx";
import { AssessmentIcon, BaselinesIcon, DataIcon } from "../components/icons/navIcons.jsx";
import { HelpIcon } from "../components/icons/featureIcons.jsx";
import DataReadinessCard from "../components/readiness/DataReadinessCard.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { bodyweightService } from "../services/bodyweightService.js";
import { tutorialService } from "../services/tutorialService.js";
import { userService } from "../services/userService.js";
import { goalPaths, strengthStandardOptions } from "../utils/onboarding.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";
import { getRankImage } from "../utils/rankImages.js";

const OVERLOAD_NOTES = {
  Conservative: "Careful: repeats a weight more often before adding load.",
  Balanced: "Balanced: normal progression rules.",
  Aggressive: "Fast: bigger jumps when recovery and effort allow."
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "Not yet");

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "F";

const formFromUser = (user) => ({
  name: user?.name || "",
  preferredUnits: user?.preferredUnits || "metric",
  selectedStrengthStandard: user?.selectedStrengthStandard || "neutral",
  trainingExperience: user?.trainingExperience || "Beginner",
  goalPath: user?.goalPath || "",
  overloadMode: user?.overloadMode || "Balanced",
  bodyweightCheckInReminderEnabled: user?.bodyweightCheckInReminderEnabled !== false,
  beginnerTipsEnabled: user?.beginnerTipsEnabled !== false,
  dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : ""
});

const cityFromUser = (user) =>
  user?.location?.cityId ? { cityId: user.location.cityId, name: user.location.cityName, countryName: user.location.countryName } : null;

const Section = ({ title, description, children, tourId }) => (
  <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-6" data-tour-id={tourId}>
    <h2 className="font-display text-xl text-white">{title}</h2>
    {description ? <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p> : null}
    <div className="mt-5 space-y-5">{children}</div>
  </section>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <button
    aria-checked={checked}
    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
    role="switch"
    type="button"
    onClick={() => onChange(!checked)}
  >
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className="mt-0.5 block text-sm text-zinc-500">{description}</span>
    </span>
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-forge-ember" : "bg-white/[0.12]"}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </span>
  </button>
);

const LinkRow = ({ to, icon: Icon, title, description, tone, tourId }) => (
  <Link
    className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
      tone === "danger" ? "border-red-400/20 bg-red-500/[0.05] hover:bg-red-500/[0.1]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]"
    }`}
    data-tour-id={tourId}
    to={to}
  >
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === "danger" ? "bg-red-500/15 text-red-200" : "bg-forge-ember/15 text-orange-200"}`}>
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-white">{title}</span>
      <span className="block text-sm text-zinc-500">{description}</span>
    </span>
    <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-600" />
  </Link>
);

const ProfilePage = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [form, setForm] = useState(() => formFromUser(user));
  const [city, setCity] = useState(() => cityFromUser(user));
  const [saved, setSaved] = useState(() => JSON.stringify({ form: formFromUser(user), city: cityFromUser(user)?.cityId || null }));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [bodyweightData, setBodyweightData] = useState({ entries: [], latest: null });
  const [resettingTutorials, setResettingTutorials] = useState(false);

  useEffect(() => {
    userService.getDataReadiness().then((data) => setReadiness(data.readiness)).catch(() => setReadiness(null));
    Promise.all([bodyweightService.getHistory(), bodyweightService.getLatest()])
      .then(([history, latest]) => setBodyweightData({ entries: history.entries || [], latest }))
      .catch(() => setBodyweightData({ entries: [], latest: null }));
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const dirty = useMemo(() => JSON.stringify({ form, city: city?.cityId || null }) !== saved, [form, city, saved]);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";

  const handleBodyweightSave = async (payload) => {
    const latest = await bodyweightService.addEntry(payload);
    const history = await bodyweightService.getHistory();
    setBodyweightData({ entries: history.entries || [], latest });
    refreshUser?.().catch(() => {});
    setMessage("Bodyweight saved.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    try {
      const { dateOfBirth, ...rest } = form;
      const payload = { ...rest };
      if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
      if (city?.cityId && city.cityId !== user?.location?.cityId) payload.cityId = city.cityId;
      await updateProfile(payload);
      setSaved(JSON.stringify({ form, city: city?.cityId || null }));
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetTutorials = async () => {
    setResettingTutorials(true);
    setError("");
    try {
      await tutorialService.resetAllTutorials();
      setMessage("Quick tours will show again on each page.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResettingTutorials(false);
    }
  };

  const rank = user?.currentOverallRank || "Copper";

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <section className="relative mb-8 overflow-clip rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-forge-ember/[0.1] via-white/[0.02] to-transparent p-5 sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-forge-ember/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-orange-400 to-forge-copper text-2xl font-black text-[#160a02] shadow-[0_18px_40px_-16px_rgba(249,115,22,0.8)]">
              {initialsOf(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display break-words text-3xl leading-tight text-white sm:text-4xl">{user?.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                {user?.username ? <span>@{user.username}</span> : null}
                <span className="inline-flex items-center gap-1.5">
                  <img alt="" className="h-4 w-4 object-contain" height="16" src={getRankImage(rank)} width="16" />
                  {rank}
                </span>
                {user?.location?.cityName ? <span>{user.location.cityName}</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.username ? (
                <Link className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09]" to={`/u/${user.username}`}>
                  Public profile
                </Link>
              ) : null}
              <TutorialLauncher pageKey="profile" steps={getTutorialSteps("profile")} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Section description="Your date of birth and city stay private. They keep your age current and set sensible defaults." title="About you" tourId="profile-basic-info">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-200">Name</span>
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none focus:border-forge-ember/60"
                  required
                  value={form.name}
                  onChange={(event) => update("name")(event.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-zinc-200">Date of birth</span>
                  <input
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none [color-scheme:dark] focus:border-forge-ember/60"
                    max={new Date().toISOString().slice(0, 10)}
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => update("dateOfBirth")(event.target.value)}
                  />
                </label>
                <CitySearch label="City you live in" value={city} onChange={setCity} />
              </div>
              <dl className="grid gap-x-4 gap-y-2 rounded-2xl bg-black/20 p-4 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="truncate text-zinc-200">{user?.email}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-zinc-500">Time zone</dt>
                  <dd className="truncate text-zinc-200">{user?.timezone ? user.timezone.replace(/_/g, " ") : "Not set"}</dd>
                </div>
              </dl>
            </Section>

            <Section description="These shape your targets, ranks and advice." title="Training">
              <ChoiceGrid
                id="goal-path"
                label="Goal"
                options={goalPaths.map((goal) => ({ value: goal.name, label: goal.name, description: goal.description }))}
                value={form.goalPath}
                onChange={update("goalPath")}
              />
              <Segmented
                label="Experience"
                options={["Beginner", "Intermediate", "Advanced"].map((value) => ({ value, label: value }))}
                value={form.trainingExperience}
                onChange={update("trainingExperience")}
              />
              <div>
                <Segmented
                  label="Progression speed"
                  options={[
                    { value: "Conservative", label: "Careful" },
                    { value: "Balanced", label: "Balanced" },
                    { value: "Aggressive", label: "Fast" }
                  ]}
                  value={form.overloadMode}
                  onChange={update("overloadMode")}
                />
                <p className="mt-2 text-sm text-zinc-500">{OVERLOAD_NOTES[form.overloadMode]}</p>
              </div>
              <div>
                <Segmented
                  label="Strength standard"
                  options={strengthStandardOptions.map((option) => ({ value: option.value, label: option.label.replace(" standard", "") }))}
                  value={form.selectedStrengthStandard}
                  onChange={update("selectedStrengthStandard")}
                />
                <p className="mt-2 text-sm text-zinc-500">Used only to compare your lifts to your bodyweight fairly when ranking.</p>
              </div>
              <Segmented
                label="Units"
                options={[
                  { value: "metric", label: "kg / cm" },
                  { value: "imperial", label: "lb / in" }
                ]}
                value={form.preferredUnits}
                onChange={update("preferredUnits")}
              />
            </Section>

            <Section title="App">
              <Toggle checked={form.beginnerTipsEnabled} description="Larger explanations of training terms around the app." label="Beginner tips" onChange={update("beginnerTipsEnabled")} />
              <Toggle
                checked={form.bodyweightCheckInReminderEnabled}
                description="A weekly nudge so bodyweight lifts and strength ratios stay accurate."
                label="Weekly bodyweight reminder"
                onChange={update("bodyweightCheckInReminderEnabled")}
              />
            </Section>

            <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 lg:bottom-4">
              <AnimatePresence>
                {dirty || saving || message || error ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0d0f13]/95 py-2 pl-5 pr-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                    exit={{ opacity: 0, y: 12 }}
                    initial={{ opacity: 0, y: 12 }}
                  >
                    <p aria-live="polite" className={`min-w-0 flex-1 truncate text-sm ${error ? "text-red-300" : message && !dirty ? "text-emerald-300" : "text-zinc-300"}`}>
                      {error || (dirty ? "You have unsaved changes" : message)}
                    </p>
                    {dirty ? (
                      <button
                        className="min-h-11 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] disabled:opacity-60"
                        disabled={saving}
                        type="submit"
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5" data-tour-id="profile-bodyweight">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-white">Bodyweight</h2>
                <p className="font-display text-2xl tabular-nums text-white">
                  {bodyweightData.latest?.currentBodyweight || user?.bodyweight || "–"}
                  <span className="text-base text-zinc-500">{unit}</span>
                </p>
              </div>
              <div className="mt-4 space-y-4">
                <BodyweightCheckInCard
                  currentBodyweight={bodyweightData.latest?.currentBodyweight || user?.bodyweight}
                  due={bodyweightData.latest?.isCheckInDue}
                  unit={unit}
                  onSave={handleBodyweightSave}
                />
                <BodyweightHistoryChart entries={bodyweightData.entries} unit={unit} />
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5" data-tour-id="profile-assessment">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forge-ember/15 text-orange-200">
                  <AssessmentIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-white">Assessment</h2>
                  <p className="text-sm text-zinc-500">
                    {user?.assessmentCompleted ? `${user?.assessmentSummary?.determinedLevel || user?.trainingExperience} · ${formatDate(user?.assessmentCompletedAt)}` : "Not completed yet"}
                  </p>
                </div>
              </div>
              {user?.assessmentSummary?.recommendationSummary ? <p className="mt-3 text-sm leading-6 text-zinc-400">{user.assessmentSummary.recommendationSummary}</p> : null}
              <Link className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09]" to="/assessment">
                {user?.assessmentCompleted ? "Retake assessment" : "Take the assessment"}
              </Link>
            </section>

            <DataReadinessCard readiness={readiness} />

            <div className="space-y-2">
              <LinkRow description="Known lifts that seed your starting weights." icon={BaselinesIcon} title="Strength baselines" to="/strength-baselines" />
              <LinkRow description="Reset history or delete a period of logs." icon={DataIcon} title="Data management" to="/data-management" tone="danger" tourId="profile-data-management" />
              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60"
                disabled={resettingTutorials}
                type="button"
                onClick={handleResetTutorials}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forge-ember/15 text-orange-200">
                  <HelpIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{resettingTutorials ? "Resetting…" : "Show quick tours again"}</span>
                  <span className="block text-sm text-zinc-500">Replays the guided tour on every page.</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
