import { useEffect, useState } from "react";
import { CalendarX, Database, Dumbbell, RefreshCw, Trash2 } from "lucide-react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import ConfirmDangerModal from "../components/ui/ConfirmDangerModal.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import IconMetricCard from "../components/visuals/IconMetricCard.jsx";
import VisualSummaryGrid from "../components/visuals/VisualSummaryGrid.jsx";
import { dataManagementService } from "../services/dataManagementService.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const formatDate = (date) =>
  date ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date)) : "None";

const DataManagementPage = () => {
  const [summary, setSummary] = useState(null);
  const [rangeForm, setRangeForm] = useState({
    startDate: "",
    endDate: "",
    deleteWorkouts: true,
    deletePRsInRange: true,
    deleteMissionsInRange: false,
    deleteReportsInRange: false
  });
  const [resetOptions, setResetOptions] = useState({
    deleteStrengthBaselines: false,
    deleteWorkoutTemplates: false,
    deleteAssessmentHistory: false
  });
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
      setMessage(data.message || "Data management action completed.");
      setModal(null);
      await loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Data Management</p>
          <h1 className="mt-2 text-3xl font-black text-white">Reset or Delete Training Data</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Delete selected training history or reset progress data. Your account, email, password, and profile stay.
          </p>
        </div>
        <Button loading={loading} type="button" variant="secondary" onClick={loadSummary}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        <TutorialLauncher pageKey="data_management" steps={getTutorialSteps("data_management")} />
      </div>

      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
      {message ? <div className="mb-5 rounded-md bg-green-500/10 p-3 text-sm text-green-200">{message}</div> : null}

      <VisualSummaryGrid className="mb-6">
        <IconMetricCard icon={Dumbbell} label="Workouts" value={summary?.workouts ?? "-"} status="Logged sessions" variant="info" />
        <IconMetricCard icon={Database} label="PRs" value={summary?.personalRecords ?? "-"} status="Personal records" variant="rank" />
        <IconMetricCard icon={Database} label="Baselines" value={summary?.strengthBaselines ?? "-"} status="Strength estimates" variant="neutral" />
        <IconMetricCard icon={Database} label="Reports" value={summary?.reports ?? "-"} status="Monthly reports" variant="neutral" />
      </VisualSummaryGrid>

      <section data-tour-id="data-summary" className="metal-panel mb-6 rounded-lg p-5">
        <h2 className="text-xl font-black text-white">Data summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-black/20 p-3"><dt className="text-slate-400">First workout</dt><dd className="mt-1 font-bold text-white">{formatDate(summary?.firstWorkoutDate)}</dd></div>
          <div className="rounded-md bg-black/20 p-3"><dt className="text-slate-400">Latest workout</dt><dd className="mt-1 font-bold text-white">{formatDate(summary?.latestWorkoutDate)}</dd></div>
          <div className="rounded-md bg-black/20 p-3"><dt className="text-slate-400">Missions</dt><dd className="mt-1 font-bold text-white">{summary?.missions ?? 0}</dd></div>
          <div className="rounded-md bg-black/20 p-3"><dt className="text-slate-400">Templates</dt><dd className="mt-1 font-bold text-white">{summary?.templates ?? 0}</dd></div>
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div data-tour-id="delete-date-range" className="metal-panel rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <CalendarX className="h-5 w-5 text-forge-ember" />
            Delete by date range
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput label="Start date" type="date" value={rangeForm.startDate} onChange={(event) => setRangeForm({ ...rangeForm, startDate: event.target.value })} />
            <FormInput label="End date" type="date" value={rangeForm.endDate} onChange={(event) => setRangeForm({ ...rangeForm, endDate: event.target.value })} />
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {[
              ["deleteWorkouts", "Delete workouts in this period"],
              ["deletePRsInRange", "Delete PRs in this period"],
              ["deleteMissionsInRange", "Delete missions and weekly targets in this period"],
              ["deleteReportsInRange", "Delete reports and analytics in this period"]
            ].map(([key, label]) => (
              <label className="flex items-center gap-3" key={key}>
                <input
                  checked={rangeForm[key]}
                  className="h-4 w-4 accent-forge-ember"
                  type="checkbox"
                  onChange={(event) => setRangeForm({ ...rangeForm, [key]: event.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
          <Button
            className="mt-5"
            type="button"
            variant="danger"
            onClick={() =>
              setModal({
                type: "range",
                title: "Delete selected period",
                confirmWord: "DELETE",
                description: "This deletes selected training data in the date range and recalculates derived systems.",
                detailsList: [`Range: ${rangeForm.startDate || "not set"} to ${rangeForm.endDate || "not set"}`]
              })
            }
          >
            Delete selected period
          </Button>
        </div>

        <div className="space-y-6">
          <div className="metal-panel rounded-lg p-5">
            <h2 className="text-xl font-black text-white">Reset Strength Baselines</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Removes entered and estimated strength baselines, but keeps workout history.
            </p>
            <Button
              className="mt-5"
              type="button"
              variant="danger"
              onClick={() =>
                setModal({
                  type: "baselines",
                  title: "Reset strength baselines",
                  confirmWord: "RESET",
                  description: "This removes all strength baselines. Workout history and workout-derived progress remain.",
                  detailsList: ["User-entered baselines", "Estimated related baselines"]
                })
              }
            >
              Reset Strength Baselines
            </Button>
          </div>

          <div data-tour-id="reset-training-data" className="rounded-lg border border-red-400/25 bg-red-500/10 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <Trash2 className="h-5 w-5 text-red-200" />
              Reset All Training Data
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-100">
              Removes workouts, PRs, ranks, recovery, overload, deload, missions, analytics, and reports. Your account and profile stay.
            </p>
            <div className="mt-4 space-y-3 text-sm text-red-50">
              {[
                ["deleteStrengthBaselines", "Also delete strength baselines"],
                ["deleteWorkoutTemplates", "Also delete workout templates"],
                ["deleteAssessmentHistory", "Also delete ForgeLift Assessment history"]
              ].map(([key, label]) => (
                <label className="flex items-center gap-3" key={key}>
                  <input
                    checked={resetOptions[key]}
                    className="h-4 w-4 accent-red-500"
                    type="checkbox"
                    onChange={(event) => setResetOptions({ ...resetOptions, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Button
              className="mt-5"
              type="button"
              variant="danger"
              onClick={() =>
                setModal({
                  type: "reset",
                  title: "Reset all training data",
                  confirmWord: "RESET",
                  description: "This cannot be undone. It keeps your account and profile, but removes training progress data.",
                  detailsList: [
                    "Workouts, PRs, ranks, recovery, weak points, balance, overload, deload, missions, analytics, reports",
                    resetOptions.deleteStrengthBaselines ? "Strength baselines will also be deleted" : "Strength baselines will be kept",
                    resetOptions.deleteWorkoutTemplates ? "Workout templates will also be deleted" : "Workout templates will be kept",
                    resetOptions.deleteAssessmentHistory ? "Assessment history will also be deleted" : "Assessment history will be kept"
                  ]
                })
              }
            >
              Reset All Training Data
            </Button>
          </div>
        </div>
      </section>

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

            if (modal.type === "baselines") {
              return runAction(() => dataManagementService.resetStrengthBaselines());
            }

            return runAction(() =>
              dataManagementService.resetTrainingData({
                confirmText: "RESET",
                ...resetOptions
              })
            );
          }}
        />
      ) : null}
    </Layout>
  );
};

export default DataManagementPage;
