import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import Layout from "../components/Layout.jsx";
import ConfirmDangerModal from "../components/ui/ConfirmDangerModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { ClearCalendarIcon, ResetIcon } from "../components/icons/featureIcons.jsx";
import { BaselinesIcon } from "../components/icons/navIcons.jsx";
import { dataManagementService } from "../services/dataManagementService.js";

const formatDate = (date) => (date ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date)) : "None");
const card = "rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6";
const dangerButton =
  "min-h-12 rounded-full border border-red-400/40 bg-red-500/10 px-5 text-sm font-bold text-red-100 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-40";
const dateInput =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none [color-scheme:dark] focus:border-forge-ember/60";

const Option = ({ checked, label, tone = "neutral", onChange }) => (
  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-200">
    <input checked={checked} className="peer sr-only" type="checkbox" onChange={(event) => onChange(event.target.checked)} />
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-200 ${
        checked ? (tone === "danger" ? "border-transparent bg-red-500 text-white" : "border-transparent bg-forge-ember text-[#160a02]") : "border-white/25"
      }`}
    >
      {checked ? <Check className="h-4 w-4" /> : null}
    </span>
    {label}
  </label>
);

const DataManagementPage = () => {
  const [summary, setSummary] = useState(null);
  const [rangeForm, setRangeForm] = useState({ startDate: "", endDate: "", deleteWorkouts: true, deletePRsInRange: true, deleteMissionsInRange: false, deleteReportsInRange: false });
  const [resetOptions, setResetOptions] = useState({ deleteStrengthBaselines: false, deleteWorkoutTemplates: false, deleteAssessmentHistory: false });
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dataManagementService.getDataSummary();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runAction = async (action) => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const data = await action();
      setMessage(data.message || "Done.");
      setModal(null);
      await loadSummary();
    } catch (err) {
      setModal(null);
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const rangeOptions = ["deleteWorkouts", "deletePRsInRange", "deleteMissionsInRange", "deleteReportsInRange"];
  const rangeHint = !rangeForm.startDate || !rangeForm.endDate
    ? "Pick a start and end date."
    : rangeForm.startDate > rangeForm.endDate
      ? "The start date is after the end date."
      : !rangeOptions.some((key) => rangeForm[key])
        ? "Choose at least one thing to delete."
        : "";

  const stats = [
    ["Workouts", summary?.workouts],
    ["Records", summary?.personalRecords],
    ["Baselines", summary?.strengthBaselines],
    ["Missions", summary?.missions],
    ["Workout plans", summary?.templates],
    ["Reports", summary?.reports]
  ];

  return (
    <Layout>
      <PageHeader
        actions={
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
            disabled={loading}
            type="button"
            onClick={loadSummary}
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />
            Refresh
          </button>
        }
        description="See what ForgeLift has stored, and clear training data when you want a fresh start. Your account, email, password and profile always stay."
        eyebrow="Your data"
        title="Data management"
        tutorialPageKey="data_management"
      />

      {message ? (
        <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm font-semibold text-emerald-200" role="status">
          {message}
        </p>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}

      <section className={card} data-tour-id="data-summary">
        <h2 className="font-display text-xl text-white sm:text-2xl">What's stored</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {summary?.firstWorkoutDate ? `Workouts from ${formatDate(summary.firstWorkoutDate)} to ${formatDate(summary.latestWorkoutDate)}.` : "No workouts logged yet."}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value]) => (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3" key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="font-display mt-0.5 text-2xl tabular-nums text-white">{loading && value === undefined ? "–" : value ?? 0}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${card} mt-4`} data-tour-id="delete-date-range">
        <h2 className="font-display flex items-center gap-2 text-xl text-white sm:text-2xl">
          <ClearCalendarIcon aria-hidden="true" className="h-6 w-6 text-orange-300" />
          Clear a date range
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Remove a stretch of training, for example a trip where you logged by mistake. Ranks and stats are recalculated afterwards.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-zinc-200">From</span>
            <input className={dateInput} max={rangeForm.endDate || undefined} type="date" value={rangeForm.startDate} onChange={(event) => setRangeForm({ ...rangeForm, startDate: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-zinc-200">To</span>
            <input className={dateInput} min={rangeForm.startDate || undefined} type="date" value={rangeForm.endDate} onChange={(event) => setRangeForm({ ...rangeForm, endDate: event.target.value })} />
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-1 text-sm font-semibold text-zinc-200">What to clear</legend>
          <div className="grid sm:grid-cols-2">
            {[
              ["deleteWorkouts", "Workouts"],
              ["deletePRsInRange", "Personal records"],
              ["deleteMissionsInRange", "Missions and weekly targets"],
              ["deleteReportsInRange", "Reports and analytics"]
            ].map(([key, label]) => (
              <Option checked={rangeForm[key]} key={key} label={label} onChange={(value) => setRangeForm({ ...rangeForm, [key]: value })} />
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className={dangerButton}
            disabled={Boolean(rangeHint)}
            type="button"
            onClick={() =>
              setModal({
                type: "range",
                title: "Clear this range",
                confirmWord: "DELETE",
                description: `Everything you ticked between ${formatDate(rangeForm.startDate)} and ${formatDate(rangeForm.endDate)} is deleted, then your stats are recalculated.`,
                detailsList: [
                  rangeForm.deleteWorkouts ? "Workouts" : null,
                  rangeForm.deletePRsInRange ? "Personal records" : null,
                  rangeForm.deleteMissionsInRange ? "Missions and weekly targets" : null,
                  rangeForm.deleteReportsInRange ? "Reports and analytics" : null
                ].filter(Boolean)
              })
            }
          >
            Clear this range
          </button>
          {rangeHint ? <p className="text-sm text-zinc-500">{rangeHint}</p> : null}
        </div>
      </section>

      <h2 className="font-display mb-3 mt-10 text-xl text-red-200">Danger zone</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-red-400/20 bg-red-500/[0.04] p-4 sm:p-6">
          <h3 className="font-display flex items-center gap-2 text-lg text-white">
            <BaselinesIcon aria-hidden="true" className="h-5 w-5 text-red-300" />
            Reset strength baselines
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">Removes the lifts you entered and everything estimated from them. Workout history stays.</p>
          <button
            className={`${dangerButton} mt-4`}
            type="button"
            onClick={() =>
              setModal({
                type: "baselines",
                title: "Reset baselines",
                confirmWord: "RESET",
                description: "All strength baselines are removed. Your workouts and the progress worked out from them stay.",
                detailsList: ["Lifts you entered", "Estimates for related lifts"]
              })
            }
          >
            Reset baselines
          </button>
        </section>

        <section className="rounded-3xl border border-red-400/30 bg-red-500/[0.07] p-4 sm:p-6" data-tour-id="reset-training-data">
          <h3 className="font-display flex items-center gap-2 text-lg text-white">
            <ResetIcon aria-hidden="true" className="h-5 w-5 text-red-300" />
            Start over
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            Removes workouts, records, ranks, recovery, missions, analytics and reports. Your account and profile stay.
          </p>
          <fieldset className="mt-3">
            <legend className="sr-only">Also remove</legend>
            {[
              ["deleteStrengthBaselines", "Also remove strength baselines"],
              ["deleteWorkoutTemplates", "Also remove workout plans"],
              ["deleteAssessmentHistory", "Also remove assessment answers"]
            ].map(([key, label]) => (
              <Option checked={resetOptions[key]} key={key} label={label} tone="danger" onChange={(value) => setResetOptions({ ...resetOptions, [key]: value })} />
            ))}
          </fieldset>
          <button
            className="mt-4 min-h-12 rounded-full bg-red-500 px-5 text-sm font-black text-white hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            type="button"
            onClick={() =>
              setModal({
                type: "reset",
                title: "Reset all training data",
                confirmWord: "RESET",
                description: "Your account and profile stay. All training progress is removed.",
                detailsList: [
                  "Workouts, records, ranks, recovery, weak points, balance, overload, deload, missions, analytics and reports",
                  resetOptions.deleteStrengthBaselines ? "Strength baselines are removed too" : "Strength baselines are kept",
                  resetOptions.deleteWorkoutTemplates ? "Workout plans are removed too" : "Workout plans are kept",
                  resetOptions.deleteAssessmentHistory ? "Assessment answers are removed too" : "Assessment answers are kept"
                ]
              })
            }
          >
            Reset all training data
          </button>
        </section>
      </div>

      {modal ? (
        <ConfirmDangerModal
          confirmWord={modal.confirmWord}
          description={modal.description}
          detailsList={modal.detailsList}
          loading={working}
          title={modal.title}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            if (modal.type === "range") {
              return runAction(() =>
                dataManagementService.deleteDataRange({
                  startDate: rangeForm.startDate,
                  endDate: rangeForm.endDate,
                  confirmText: "DELETE",
                  options: {
                    deleteWorkouts: rangeForm.deleteWorkouts,
                    deletePRsInRange: rangeForm.deletePRsInRange,
                    deleteMissionsInRange: rangeForm.deleteMissionsInRange,
                    deleteReportsInRange: rangeForm.deleteReportsInRange
                  }
                })
              );
            }
            if (modal.type === "baselines") return runAction(() => dataManagementService.resetStrengthBaselines());
            return runAction(() => dataManagementService.resetTrainingData({ confirmText: "RESET", ...resetOptions }));
          }}
        />
      ) : null}
    </Layout>
  );
};

export default DataManagementPage;
