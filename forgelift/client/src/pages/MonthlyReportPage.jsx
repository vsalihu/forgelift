import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import MonthlyReportCard from "../components/reports/MonthlyReportCard.jsx";
import MonthlyReportSummary from "../components/reports/MonthlyReportSummary.jsx";
import NextMonthFocusList from "../components/reports/NextMonthFocusList.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { monthlyReportService } from "../services/monthlyReportService.js";
import { helpText } from "../utils/helpText.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const now = new Date();

const buildCopyText = (report) => {
  if (!report) return "";
  return [
    report.title,
    report.summary,
    `Workouts: ${report.totalWorkouts}`,
    `Volume: ${report.totalVolume}kg`,
    `PRs: ${report.totalPRs}`,
    `Missions completed: ${report.missionsCompleted}`,
    `Strongest area: ${report.strongestArea || "-"}`,
    `Weakest area: ${report.weakestArea || "-"}`,
    "Next month focus:",
    ...(report.nextMonthFocus || []).map((item) => `- ${item}`)
  ].join("\n");
};

const MonthlyReportPage = () => {
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const [currentData, reportsData] = await Promise.all([
        monthlyReportService.getCurrentMonthlyReport(),
        monthlyReportService.getMonthlyReports()
      ]);
      setReport(currentData.report);
      setReports(reportsData.reports || []);
      setMonth(currentData.report?.month || now.getMonth() + 1);
      setYear(currentData.report?.year || now.getFullYear());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    setError("");

    try {
      const data = await monthlyReportService.generateMonthlyReport(Number(month), Number(year));
      setReport(data.report);
      const reportsData = await monthlyReportService.getMonthlyReports();
      setReports(reportsData.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(report));
      setMessage("Report summary copied.");
    } catch (_error) {
      setMessage("Copy failed in this browser.");
    }
  };

  const handleSelectReport = async (selectedReport) => {
    setMonth(selectedReport.month);
    setYear(selectedReport.year);
    const data = await monthlyReportService.getMonthlyReport(selectedReport.year, selectedReport.month);
    setReport(data.report);
  };

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Monthly Reports</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
          Exportable progress summary <HelpTooltip {...helpText.monthlyReport} />
        </h1>
        <div className="mt-4">
          <TutorialLauncher pageKey="monthly_reports" steps={getTutorialSteps("monthly_reports")} />
        </div>
      </div>

      {loading ? <p className="text-forge-steel">Loading monthly report...</p> : null}
      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
      {message ? <div className="mb-5 rounded-md bg-green-500/10 p-3 text-sm text-green-200">{message}</div> : null}

      {!loading ? (
        <div className="space-y-6">
          <section data-tour-id="monthly-reports-overview" className="metal-panel rounded-lg p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <FormInput label="Month" max="12" min="1" type="number" value={month} onChange={(event) => setMonth(event.target.value)} />
              <FormInput label="Year" min="2000" type="number" value={year} onChange={(event) => setYear(event.target.value)} />
              <Button loading={generating} type="button" onClick={handleGenerate}>
                Generate report
              </Button>
              <Button disabled={!report} type="button" variant="secondary" onClick={handleCopy}>
                Copy summary
              </Button>
            </div>
          </section>

          <MonthlyReportSummary report={report} />

          {report ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="metal-panel rounded-lg p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  Report details <HelpTooltip title="Report Details" content="A plain-language summary of the strongest area, weakest area, recovery, balance, and missions for the month." />
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Best exercise: {report.bestExerciseImprovement?.exerciseName || "-"}</p>
                  <p>Training balance: {report.balanceSummary?.score || 0}/100 {report.balanceSummary?.status || ""}</p>
                  <p>Average recovery: {report.recoverySummary?.averageRecoveryScore || 0}%</p>
                  <p>Active deloads: {report.deloadSummary?.activeCount || 0}</p>
                  <p>Mission completion: {report.missionSummary?.completionPercentage || 0}%</p>
                </div>
              </section>
              <NextMonthFocusList items={report.nextMonthFocus || []} />
            </div>
          ) : null}

          <section className="metal-panel rounded-lg p-5">
            <h2 className="text-xl font-bold text-white">Previous reports</h2>
            {reports.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reports.map((item) => (
                  <MonthlyReportCard key={item._id} report={item} onSelect={handleSelectReport} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No previous reports yet.</p>
            )}
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default MonthlyReportPage;
