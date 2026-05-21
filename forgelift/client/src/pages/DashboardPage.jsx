import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ClipboardCheck, Dumbbell, Flame, ListChecks, Medal, ShieldAlert, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import DataReadinessCard from "../components/readiness/DataReadinessCard.jsx";
import BodyweightCheckInCard from "../components/bodyweight/BodyweightCheckInCard.jsx";
import AnimatedProgressBar from "../components/visuals/AnimatedProgressBar.jsx";
import IconMetricCard from "../components/visuals/IconMetricCard.jsx";
import ProgressRing from "../components/visuals/ProgressRing.jsx";
import StatPill from "../components/visuals/StatPill.jsx";
import VisualSummaryGrid from "../components/visuals/VisualSummaryGrid.jsx";
import RankBadge from "../components/ranks/RankBadge.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { advancedAnalyticsService } from "../services/advancedAnalyticsService.js";
import { bodyweightService } from "../services/bodyweightService.js";
import { deloadService } from "../services/deloadService.js";
import { missionService } from "../services/missionService.js";
import { monthlyReportService } from "../services/monthlyReportService.js";
import { overloadService } from "../services/overloadService.js";
import { personalRecordService } from "../services/personalRecordService.js";
import { rankService } from "../services/rankService.js";
import { recoveryService } from "../services/recoveryService.js";
import { trainingBalanceService } from "../services/trainingBalanceService.js";
import { userService } from "../services/userService.js";
import { weakPointService } from "../services/weakPointService.js";
import { workoutService } from "../services/workoutService.js";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date));

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const CompactCard = ({ title, value, note, icon: Icon, tone = "default", to }) => {
  const toneClass =
    tone === "warning"
      ? "border-orange-400/20 bg-orange-500/10"
      : tone === "good"
        ? "border-emerald-400/20 bg-emerald-500/10"
        : "border-white/10 bg-black/20";
  const content = (
    <div className={`rounded-lg border p-4 transition ${toneClass} ${to ? "hover:border-forge-copper/60" : ""}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        {Icon ? <Icon className="h-5 w-5 text-forge-ember" /> : null}
      </div>
      <p className="text-xl font-black text-white">{value}</p>
      {note ? <p className="mt-2 text-sm leading-5 text-slate-400">{note}</p> : null}
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState({
    recentWorkouts: [],
    prSummary: null,
    rankData: null,
    recoveryData: null,
    trainingBalance: null,
    weakPoints: [],
    overloadRecommendations: [],
    deloadRecommendations: [],
    missionData: null,
    monthlyOverview: null,
    monthlyInsights: null,
    monthlyReport: null,
    readiness: null,
    bodyweight: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        workoutData,
        prData,
        ranks,
        recovery,
        balance,
        weakPointData,
        overloadData,
        deloadData,
        missions,
        analyticsOverview,
        analyticsInsights,
        reportData,
        readinessData,
        bodyweightData
      ] = await Promise.all([
        workoutService.getWorkouts({ limit: 3 }),
        personalRecordService.getSummary(),
        rankService.getRanks(),
        recoveryService.getTodayRecommendation(),
        trainingBalanceService.getTrainingBalance(),
        weakPointService.getWeakPoints(),
        overloadService.getOverloadRecommendations(),
        deloadService.getDeloadRecommendations(),
        missionService.getMissions(),
        advancedAnalyticsService.getAnalyticsOverview("month"),
        advancedAnalyticsService.getInsights("month"),
        monthlyReportService.getCurrentMonthlyReport(),
        userService.getDataReadiness(),
        bodyweightService.getLatest()
      ]);

      setState({
        recentWorkouts: workoutData.workouts || [],
        prSummary: prData,
        rankData: ranks,
        recoveryData: recovery,
        trainingBalance: balance.trainingBalance,
        weakPoints: weakPointData.weakPoints || [],
        overloadRecommendations: overloadData.recommendations || [],
        deloadRecommendations: deloadData.recommendations || [],
        missionData: missions,
        monthlyOverview: analyticsOverview.overview,
        monthlyInsights: analyticsInsights,
        monthlyReport: reportData.report,
        readiness: readinessData.readiness,
        bodyweight: bodyweightData
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const {
    recentWorkouts,
    prSummary,
    rankData,
    recoveryData,
    trainingBalance,
    weakPoints,
    overloadRecommendations,
    deloadRecommendations,
    missionData,
    monthlyOverview,
    monthlyInsights,
    monthlyReport,
    readiness,
    bodyweight
  } = state;

  const latestPR = prSummary?.latestPR;
  const todayRecommendation = recoveryData?.todayRecommendation;
  const topOverload = overloadRecommendations[0];
  const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const highestDeload = [...deloadRecommendations].sort(
    (a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
  )[0];
  const topMission = missionData?.activeMissions?.[0];
  const weeklyTarget = missionData?.weeklyTarget;
  const readyMuscles = recoveryData?.recoveryScores?.filter((score) => score.score >= 75).slice(0, 3) || [];
  const avoidMuscles = recoveryData?.recoveryScores?.filter((score) => score.score < 60).slice(0, 3) || [];
  const bodyweightUnit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const handleBodyweightSave = async (payload) => {
    const data = await bodyweightService.checkIn(payload);
    setState((current) => ({ ...current, bodyweight: data }));
  };

  return (
    <Layout>
      <section className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 shadow-metal sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Today</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-4xl">Welcome, {user?.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <RankBadge rank={rankData?.overallRank || user?.currentOverallRank || "Copper"} />
              <StatPill variant="rank">{rankData?.xp || user?.xp || 0} XP</StatPill>
              <StatPill variant="info">{todayRecommendation?.bestWorkoutType || "Any Workout"}</StatPill>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Best today: {todayRecommendation?.bestWorkoutType || "Any Workout"}.{" "}
              {todayRecommendation?.reasons?.[0] || "Start with Gym Mode when you are ready to train."}
            </p>
            {todayRecommendation?.reasons?.length ? (
              <div className="mt-3 flex max-w-2xl flex-wrap gap-2">
                {todayRecommendation.reasons.slice(0, 4).map((reason) => (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200" key={reason}>
                    {reason}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 max-w-xl">
              <AnimatedProgressBar
                label={`Progress to ${rankData?.overallProgress?.nextRank?.name || "next rank"}`}
                value={rankData?.overallProgress?.progressPercentage || 0}
                variant="rank"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Button className="min-h-12 w-full text-base" type="button" onClick={() => { window.location.href = "/gym-mode"; }}>
              <Dumbbell className="h-5 w-5" />
              Start Gym Mode
            </Button>
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-base font-semibold text-white transition hover:bg-white/15" to="/workouts/new">
              Log Workout
            </Link>
          </div>
        </div>
      </section>

      {!user?.assessmentCompleted ? (
        <section className="mb-6 rounded-xl border border-forge-copper/30 bg-forge-copper/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="mt-1 rounded-lg bg-forge-ember/20 p-2 text-forge-ember">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-white">Complete your ForgeLift Assessment</h2>
                <p className="mt-1 text-sm leading-6 text-orange-100">
                  Answer a few questions so ForgeLift can estimate your starting level, create strength baselines,
                  and personalise your recommendations.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              to="/assessment"
            >
              Start Assessment
            </Link>
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-300">
                Assessment Level: {user.assessmentSummary?.determinedLevel || user.trainingExperience || "Not set"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Confidence: {user.assessmentSummary?.confidence || "Low"}
                {user.assessmentCompletedAt ? ` / Last completed: ${formatDate(user.assessmentCompletedAt)}` : ""}
              </p>
            </div>
            <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/assessment">
              Retake Assessment
            </Link>
          </div>
        </section>
      )}

      {!loading && !error && bodyweight?.isCheckInDue ? (
        <section className="mb-6">
          <BodyweightCheckInCard
            currentBodyweight={bodyweight.currentBodyweight || user?.bodyweight}
            due={bodyweight.isCheckInDue}
            unit={bodyweightUnit}
            onSave={handleBodyweightSave}
          />
        </section>
      ) : null}

      {loading ? <LoadingSkeleton rows={6} variant="dashboard" /> : null}
      {error ? <ErrorState message={error} onRetry={loadDashboardData} /> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <VisualSummaryGrid>
            <IconMetricCard
              icon={Trophy}
              label="Overall Rank"
              value={rankData?.overallRank || "Copper"}
              status={`${rankData?.xp || 0} XP`}
              variant="rank"
              to="/ranks"
            />
            <IconMetricCard
              icon={Activity}
              label="Recovery"
              value={todayRecommendation?.bestWorkoutType || "No data"}
              status={avoidMuscles.length ? `Avoid: ${avoidMuscles.map((item) => item.muscleGroup).join(", ")}` : "No major avoid warning"}
              variant={avoidMuscles.length ? "warning" : "success"}
              to="/recovery"
            />
            <IconMetricCard
              icon={ListChecks}
              label="Weekly Target"
              value={weeklyTarget ? `${weeklyTarget.completedWorkouts}/${weeklyTarget.targetWorkouts}` : "No target"}
              status={topMission?.title || "Open missions for this week's plan"}
              variant="info"
              to="/missions"
            />
            <IconMetricCard
              icon={ShieldAlert}
              label="Deload"
              value={highestDeload ? `${highestDeload.severity} alert` : "Clear"}
              status={highestDeload?.reason || "No strong fatigue or plateau signal"}
              variant={highestDeload ? "danger" : "success"}
              to="/deload"
            />
          </VisualSummaryGrid>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="metal-panel rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Action Required</p>
                  <h2 className="mt-2 text-xl font-black text-white">Most important now</h2>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CompactCard
                  icon={Zap}
                  title="Smart Overload"
                  value={topOverload?.exerciseName || "No target yet"}
                  note={topOverload?.reason || "Log more workouts to unlock recommendations"}
                  to="/overload"
                />
                <CompactCard
                  icon={AlertTriangle}
                  title="Top Weak Point"
                  value={weakPoints[0]?.muscleGroup || weakPoints[0]?.title || "None active"}
                  note={weakPoints[0]?.recommendation || "No major imbalance warning"}
                  tone={weakPoints[0] ? "warning" : "default"}
                  to="/weak-points"
                />
              </div>
            </div>

            <div className="metal-panel rounded-xl p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Rank Progress</p>
              <h2 className="mt-2 text-xl font-black text-white">{rankData?.overallRank || "Copper"}</h2>
              <div className="mt-5 flex items-center gap-5">
                <ProgressRing
                  label="Rank"
                  size={120}
                  sublabel={rankData?.overallProgress?.nextRank?.name || "Max"}
                  value={rankData?.overallProgress?.progressPercentage || 0}
                  variant="rank"
                />
                <div className="flex-1">
                  <AnimatedProgressBar
                    label={`${rankData?.overallProgress?.pointsToNextRank || 0} points to ${
                      rankData?.overallProgress?.nextRank?.name || "max rank"
                    }`}
                    value={rankData?.overallProgress?.progressPercentage || 0}
                    variant="rank"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="metal-panel rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Recovery</p>
                  <h2 className="mt-2 text-xl font-black text-white">Ready vs avoid</h2>
                </div>
                <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/recovery">
                  View
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-black/20 p-4">
                  <p className="mb-3 font-bold text-white">Ready</p>
                  <div className="flex flex-wrap gap-2">
                    {readyMuscles.length ? readyMuscles.map((score) => (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-200" key={score.muscleGroup}>
                        {score.muscleGroup} {score.score}%
                      </span>
                    )) : <span className="text-sm text-slate-400">No ready muscles yet.</span>}
                  </div>
                </div>
                <div className="rounded-lg bg-black/20 p-4">
                  <p className="mb-3 font-bold text-white">Avoid heavy work</p>
                  <div className="flex flex-wrap gap-2">
                    {avoidMuscles.length ? avoidMuscles.map((score) => (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200" key={score.muscleGroup}>
                        {score.muscleGroup} {score.score}%
                      </span>
                    )) : <span className="text-sm text-slate-400">No avoid warning.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="metal-panel rounded-xl p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Progress</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <CompactCard
                  icon={Medal}
                  title="Latest PR"
                  value={latestPR?.exerciseName || "None yet"}
                  note={latestPR?.recordType?.replaceAll("_", " ") || "Log workouts to detect PRs"}
                  to="/progress/prs"
                />
                <CompactCard
                  icon={Flame}
                  title="This Month"
                  value={`${monthlyOverview?.totalWorkouts || 0} workouts`}
                  note={`${monthlyOverview?.totalPRs || 0} PRs / ${monthlyOverview?.missionsCompleted || 0} missions`}
                  to="/analytics/advanced"
                />
              </div>
              <p className="mt-4 rounded-lg bg-black/20 p-4 text-sm leading-6 text-slate-400">
                {monthlyInsights?.recommendations?.[0] || monthlyReport?.summary || "Log more workouts to unlock monthly insights."}
              </p>
            </div>
          </section>

          <section className="metal-panel rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Recent Activity</p>
                <h2 className="mt-2 text-xl font-black text-white">Latest sessions</h2>
              </div>
              <Link className="text-sm font-semibold text-forge-ember hover:text-orange-300" to="/workouts">
                History
              </Link>
            </div>
            {recentWorkouts.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {recentWorkouts.map((workout) => {
                  const muscles = Object.keys(workout.muscleLoadSummary || workout.muscleVolumeSummary || {});
                  return (
                    <Link className="rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-forge-copper/60" key={workout._id} to={`/workouts/${workout._id}`}>
                      <p className="text-sm text-forge-steel">{formatDate(workout.date)}</p>
                      <h3 className="mt-2 font-bold text-white">{workout.title}</h3>
                      <p className="mt-3 text-sm text-slate-400">Volume: {formatNumber(workout.totalVolume)}kg</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{muscles.length ? muscles.join(", ") : "No muscles listed"}</p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-center">
                <p className="font-bold text-white">Your training log is empty.</p>
                <p className="mt-2 text-sm text-slate-400">Start Gym Mode to record your first session.</p>
                <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white" to="/gym-mode">
                  Start Gym Mode
                </Link>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {readiness && readiness.overallReadiness !== "ready" ? (
        <section className="mb-6">
          <DataReadinessCard readiness={readiness} />
        </section>
      ) : null}
    </Layout>
  );
};

export default DashboardPage;
