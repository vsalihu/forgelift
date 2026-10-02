import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import Layout from "../components/Layout.jsx";
import AnalyticsTabs from "../components/analytics/AnalyticsTabs.jsx";
import StatTile from "../components/analytics/StatTile.jsx";
import { GoalIcon, TrendingDownIcon, TrendingUpIcon } from "../components/icons/featureIcons.jsx";
import { ReportsIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { monthlyReportService } from "../services/monthlyReportService.js";

const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2000, index, 1)));
const YEARS = Array.from({ length: 6 }, (_, index) => now.getFullYear() - index);
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const compact = (value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
const shortMonth = (report) => `${MONTHS[report.month - 1]?.slice(0, 3)} ${report.year}`;

const buildCopyText = (report, unit) => {
  if (!report) return "";
  return [
    report.title,
    report.summary,
    `Workouts: ${report.totalWorkouts}`,
    `Volume: ${formatNumber(report.totalVolume)} ${unit}`,
    `PRs: ${report.totalPRs}`,
    `Missions completed: ${report.missionsCompleted}`,
    `Strongest area: ${report.strongestArea || "-"}`,
    `Weakest area: ${report.weakestArea || "-"}`,
    "Next month focus:",
    ...(report.nextMonthFocus || []).map((item) => `- ${item}`)
  ].join("\n");
};

const PillSelect = ({ label, value, onChange, children }) => (
  <label className="relative flex min-w-0 flex-1 sm:flex-none">
    <span className="sr-only">{label}</span>
    <select
      className="min-h-12 w-full appearance-none rounded-full border border-white/10 bg-white/[0.04] py-2 pl-4 pr-10 text-sm font-bold text-white outline-none [color-scheme:dark] hover:border-white/25 focus:border-forge-ember/60 sm:min-w-[9rem]"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {children}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
  </label>
);

const MonthlyReportPage = () => {
  const { user } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const [currentData, reportsData] = await Promise.all([monthlyReportService.getCurrentMonthlyReport(), monthlyReportService.getMonthlyReports()]);
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

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(""), 3000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await monthlyReportService.generateMonthlyReport(month, year);
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
      await navigator.clipboard.writeText(buildCopyText(report, unit));
      setCopied("Copied. Paste it anywhere.");
    } catch (_error) {
      setCopied("This browser blocked copying.");
    }
  };

  const openReport = async (item) => {
    setMonth(item.month);
    setYear(item.year);
    setError("");
    try {
      const data = await monthlyReportService.getMonthlyReport(item.year, item.month);
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    }
  };

  const showingSelected = report && report.month === month && report.year === year;
  const details = report
    ? [
        ["Biggest improvement", report.bestExerciseImprovement?.exerciseName || "–"],
        ["Training balance", `${report.balanceSummary?.score || 0}/100${report.balanceSummary?.status ? `, ${report.balanceSummary.status.toLowerCase()}` : ""}`],
        ["Average recovery", `${report.recoverySummary?.averageRecoveryScore || 0}%`],
        ["Missions completed", `${report.missionSummary?.completionPercentage || 0}%`],
        ["Deloads running", report.deloadSummary?.activeCount || 0]
      ]
    : [];

  return (
    <Layout>
      <AnalyticsTabs />
      <PageHeader
        description="One page per month: what you did, what improved, and what to focus on next. Built only from what you actually logged."
        eyebrow="Reports"
        title="Monthly report"
        tutorialPageKey="monthly_reports"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" data-tour-id="monthly-reports-overview">
        <div className="flex gap-2">
          <PillSelect label="Month" value={month} onChange={setMonth}>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </PillSelect>
          <PillSelect label="Year" value={year} onChange={setYear}>
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </PillSelect>
        </div>
        <button
          className="min-h-12 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
          disabled={generating}
          type="button"
          onClick={handleGenerate}
        >
          {generating ? "Building..." : showingSelected ? "Rebuild report" : "Build report"}
        </button>
      </div>

      {reports.length ? (
        <div aria-label="Past reports" className="scrollbar-none -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0" role="group">
          {reports.map((item) => {
            const active = report?.month === item.month && report?.year === item.year;
            return (
              <button
                aria-pressed={active}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  active ? "border-forge-ember/50 bg-forge-ember/10 text-orange-100" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                }`}
                key={item._id || `${item.year}-${item.month}`}
                type="button"
                onClick={() => openReport(item)}
              >
                {shortMonth(item)}
                <span className="ml-1.5 text-xs text-zinc-500">{item.totalWorkouts} workouts</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? <div className="mt-6"><ErrorState message={error} onRetry={loadReports} /></div> : null}

      {loading ? <div aria-busy="true" className="mt-6 h-96 animate-pulse rounded-3xl bg-white/[0.03]" /> : null}

      {!loading && !report && !error ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/12 px-6 py-12 text-center">
          <ReportsIcon aria-hidden="true" className="mx-auto h-10 w-10 text-orange-300" />
          <p className="font-display mt-3 text-2xl text-white">No report for this month yet.</p>
          <p className="mt-2 text-zinc-400">Pick a month and build one.</p>
        </div>
      ) : null}

      {!loading && report ? (
        <div className="mt-6 space-y-4">
          <section className="relative overflow-clip rounded-[2rem] border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.12] via-white/[0.02] to-transparent p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">{MONTHS[report.month - 1]} {report.year}</p>
                <h2 className="font-display mt-1 text-2xl leading-tight text-white sm:text-3xl">{report.title}</h2>
                {report.summary ? <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-300">{report.summary}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 text-sm font-bold text-white hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  type="button"
                  onClick={handleCopy}
                >
                  {copied.startsWith("Copied") ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  Copy summary
                </button>
                <p aria-live="polite" className="min-h-5 text-xs text-zinc-400">
                  {copied}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Workouts" tone="accent" value={formatNumber(report.totalWorkouts)} />
            <StatTile label="Volume" sub={`${formatNumber(report.totalVolume)} ${unit} lifted`} value={`${compact(report.totalVolume)} ${unit}`} />
            <StatTile label="Records" value={formatNumber(report.totalPRs)} />
            <StatTile label="Missions" value={formatNumber(report.missionsCompleted)} />
            <StatTile icon={TrendingUpIcon} label="Strongest area" value={report.strongestArea || "–"} />
            <StatTile icon={TrendingDownIcon} label="Needs work" value={report.weakestArea || "–"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
              <h3 className="font-display text-lg text-white">The details</h3>
              <dl className="mt-3 divide-y divide-white/[0.06]">
                {details.map(([label, value]) => (
                  <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm" key={label}>
                    <dt className="text-zinc-400">{label}</dt>
                    <dd className="text-right font-bold tabular-nums text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
              <h3 className="font-display flex items-center gap-2 text-lg text-white">
                <GoalIcon aria-hidden="true" className="h-5 w-5 text-orange-300" />
                Focus for next month
              </h3>
              {report.nextMonthFocus?.length ? (
                <ol className="mt-3 space-y-2.5 text-sm leading-6 text-zinc-300">
                  {report.nextMonthFocus.map((item, index) => (
                    <li className="flex gap-3" key={item}>
                      <span className="font-display mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-xs text-orange-300">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">Nothing flagged. Keep doing what you're doing.</p>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default MonthlyReportPage;
