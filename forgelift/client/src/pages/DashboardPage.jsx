import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import DataReadinessCard from "../components/readiness/DataReadinessCard.jsx";
import BodyweightCheckInCard from "../components/bodyweight/BodyweightCheckInCard.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import WeakPointCard from "../components/weakPoints/WeakPointCard.jsx";
import { rankSrc } from "../components/landing/shared.jsx";
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
import { userService } from "../services/userService.js";
import { weakPointService } from "../services/weakPointService.js";
import { workoutService } from "../services/workoutService.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";
import { getMuscleImage } from "../utils/muscleImages.js";
import { FlameIcon, MedalIcon } from "../components/icons/featureIcons.jsx";
import { AssessmentIcon, DeloadIcon, GymModeIcon, MissionsIcon, OverloadIcon, RecoveryIcon } from "../components/icons/navIcons.jsx";

const EASE = [0.16, 1, 0.3, 1];
const formatDate = (date) => new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" }).format(new Date(date));
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Late session";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// Section heading with an optional link on the right.
const SectionTitle = ({ title, to, linkLabel }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <h2 className="font-display text-xl text-white sm:text-2xl">{title}</h2>
    {to ? (
      <Link className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200" to={to}>
        {linkLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    ) : null}
  </div>
);

// Rank badge inside a ring that fills toward the next rank.
const RankRing = ({ rank, progress }) => {
  const reduce = useReducedMotion();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40">
      <div aria-hidden="true" className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35),transparent_70%)] blur-xl" />
      <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" fill="none" r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <motion.circle
          animate={{ strokeDashoffset: circumference * (1 - Math.min(100, Math.max(0, progress)) / 100) }}
          cx="60"
          cy="60"
          fill="none"
          initial={reduce ? false : { strokeDashoffset: circumference }}
          r={radius}
          stroke="url(#rank-ring)"
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth="5"
          style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        />
        <defs>
          <linearGradient id="rank-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#b87333" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
        </defs>
      </svg>
      <img alt={`${rank} rank badge`} className="absolute inset-[22%] h-[56%] w-[56%] object-contain drop-shadow-[0_10px_24px_rgba(249,115,22,0.4)]" height="320" src={rankSrc(rank)} width="320" />
    </div>
  );
};

const StatTile = ({ to, icon: Icon, label, value, detail, tone = "default", tourId }) => (
  <Link
    className={`group flex min-h-[8.5rem] flex-col justify-between rounded-2xl border p-4 transition-[border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:p-5 ${
      tone === "alert"
        ? "border-forge-ember/40 bg-forge-ember/[0.08] hover:border-forge-ember/70"
        : "border-white/[0.07] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"
    }`}
    data-tour-id={tourId}
    to={to}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-zinc-400">{label}</p>
      <Icon className={`h-5 w-5 shrink-0 ${tone === "alert" ? "text-orange-300" : "text-zinc-500 group-hover:text-orange-300"}`} />
    </div>
    <div className="mt-3 min-w-0">
      <p className="font-display text-xl leading-tight text-white [overflow-wrap:anywhere] sm:text-[1.65rem]">{value}</p>
      {detail ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-400">{detail}</p> : null}
    </div>
  </Link>
);

const MuscleTile = ({ score }) => {
  const image = getMuscleImage(score.muscleGroup);
  const value = Math.round(score.score ?? 0);
  const ready = value >= 75;
  const low = value < 60;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:gap-3 sm:p-3">
      <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16">
        <svg aria-hidden="true" className="absolute inset-0 -rotate-90" viewBox="0 0 60 60">
          <circle cx="30" cy="30" fill="none" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="30"
            cy="30"
            fill="none"
            r={radius}
            stroke={ready ? "#fb923c" : low ? "rgba(248,113,113,0.8)" : "rgba(249,115,22,0.5)"}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        {image ? <img alt="" className="absolute inset-[12%] h-[76%] w-[76%] object-contain" height="160" loading="lazy" src={image} width="160" /> : null}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{score.muscleGroup}</p>
        <p className={`text-xs tabular-nums sm:text-sm ${ready ? "text-orange-300" : low ? "text-red-300" : "text-zinc-400"}`}>
          {value}% {ready ? "ready" : low ? "go easy" : "recovering"}
        </p>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [state, setState] = useState({
    recentWorkouts: [],
    prSummary: null,
    rankData: null,
    recoveryData: null,
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

  const firstName = user?.name?.split(" ")[0] || "lifter";
  const gymDraftActive = (() => {
    try {
      const draft = JSON.parse(localStorage.getItem("forgeliftGymModeDraft") || "null");
      return Boolean((draft?.workout || draft)?.exercises?.length);
    } catch (_error) {
      return false;
    }
  })();
  const rank = rankData?.overallRank || user?.currentOverallRank || "Copper";
  const progress = rankData?.overallProgress || {};
  const nextRank = progress.nextRank?.name;
  const today = recoveryData?.todayRecommendation;
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const topDeload = [...deloadRecommendations].sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))[0];
  const weeklyTarget = missionData?.weeklyTarget;
  const topMission = missionData?.activeMissions?.[0];
  const scores = (recoveryData?.recoveryScores || []).filter((score) => score.score !== null && score.score !== undefined);
  const readyCount = scores.filter((score) => score.score >= 75).length;
  const avoid = scores.filter((score) => score.score < 60);
  const muscleTiles = [...scores].sort((a, b) => a.score - b.score).slice(0, 6);
  const latestPR = prSummary?.latestPR;
  const insight = monthlyInsights?.recommendations?.[0] || monthlyReport?.summary;
  const showReadiness = readiness && readiness.overallReadiness !== "ready";

  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE }
  });

  return (
    <Layout>
      <motion.section
        {...rise(0)}
        className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(70%_120%_at_100%_0%,rgba(249,115,22,0.16),transparent_60%),linear-gradient(180deg,#111318,#0b0c10)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8"
        data-tour-id="dashboard-hero"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-sm font-semibold text-zinc-400">{greeting()},</p>
            <h1 className="font-display mt-1 text-4xl leading-[1.05] text-white sm:text-5xl">{firstName}.</h1>
            <p className="mt-5 flex flex-wrap items-baseline gap-x-2 text-lg text-zinc-300">
              Best today:
              <span className="font-display text-2xl text-orange-300">{today?.bestWorkoutType || "Any workout"}</span>
            </p>
            {today?.reasons?.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {today.reasons.slice(0, 3).map((reason) => (
                  <li className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-300" key={reason}>
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-base text-zinc-400">Start Gym Mode whenever you're ready to train.</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button className="min-h-12 px-6 text-base" data-tour-id="dashboard-start-gym-mode" type="button" onClick={() => navigate("/gym-mode")}>
                <GymModeIcon className="h-5 w-5" />
                {gymDraftActive ? "Resume workout" : "Start Gym Mode"}
              </Button>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-6 text-base font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/workouts/new"
              >
                Log a workout
              </Link>
              <TutorialLauncher autoStart pageKey="dashboard" steps={getTutorialSteps("dashboard")} />
            </div>
          </div>

          <Link
            className="flex items-center gap-5 rounded-3xl p-2 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 lg:flex-col lg:gap-3 lg:p-4 lg:text-center"
            to="/ranks"
          >
            <RankRing progress={progress.progressPercentage || 0} rank={rank} />
            <div>
              <p className="font-display text-2xl text-white">{rank}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {nextRank ? (
                  <>
                    <span className="font-semibold tabular-nums text-orange-300">{Math.round(progress.progressPercentage || 0)}%</span> to {nextRank}
                  </>
                ) : (
                  "Top rank reached"
                )}
              </p>
              {progress.pointsToNextRank ? <p className="mt-0.5 text-xs tabular-nums text-zinc-500">{formatNumber(progress.pointsToNextRank)} points to go</p> : null}
            </div>
          </Link>
        </div>
      </motion.section>

      {!loading && !error && bodyweight?.isCheckInDue ? (
        <section className="mb-6">
          <BodyweightCheckInCard
            currentBodyweight={bodyweight.currentBodyweight || user?.bodyweight}
            due={bodyweight.isCheckInDue}
            unit={unit}
            onSave={async (payload) => {
              const data = await bodyweightService.checkIn(payload);
              setState((current) => ({ ...current, bodyweight: data }));
            }}
          />
        </section>
      ) : null}

      {!user?.assessmentCompleted ? (
        <Link
          className="mb-6 flex items-center gap-4 rounded-2xl border border-forge-ember/30 bg-forge-ember/[0.07] p-4 transition-colors hover:border-forge-ember/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          to="/assessment"
        >
          <AssessmentIcon className="h-6 w-6 shrink-0 text-orange-300" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-white">Finish your assessment</span>
            <span className="block text-sm text-zinc-400">Two minutes for better starting weights and recommendations.</span>
          </span>
          <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-300" />
        </Link>
      ) : null}

      {showReadiness ? (
        <section className="mb-6" data-tour-id="dashboard-data-readiness">
          <DataReadinessCard readiness={readiness} />
        </section>
      ) : null}

      {loading ? <LoadingSkeleton rows={6} variant="dashboard" /> : null}
      {error ? <ErrorState message={error} onRetry={loadDashboardData} /> : null}

      {!loading && !error ? (
        <div className="space-y-10">
          <motion.section {...rise(0.08)} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              detail={topMission?.title || "Open missions for this week's plan"}
              icon={MissionsIcon}
              label="This week"
              to="/missions"
              tourId="dashboard-missions"
              value={weeklyTarget ? `${weeklyTarget.completedWorkouts} of ${weeklyTarget.targetWorkouts}` : "No target"}
            />
            <StatTile
              detail={avoid.length ? `Go easy on ${avoid.slice(0, 2).map((item) => item.muscleGroup).join(", ")}` : "Nothing to avoid today"}
              icon={RecoveryIcon}
              label="Recovery"
              to="/recovery"
              tourId="dashboard-recovery"
              value={scores.length ? `${readyCount} ready` : "No data yet"}
            />
            <StatTile
              detail={`${monthlyOverview?.totalPRs || 0} PRs, ${monthlyOverview?.missionsCompleted || 0} missions`}
              icon={FlameIcon}
              label="This month"
              to="/analytics/advanced"
              value={`${monthlyOverview?.totalWorkouts || 0} workouts`}
            />
            <StatTile
              detail={topDeload?.reason || "No fatigue or plateau warning"}
              icon={DeloadIcon}
              label="Deload"
              to="/deload"
              tone={topDeload && severityOrder[topDeload.severity] >= 3 ? "alert" : "default"}
              value={topDeload ? `${topDeload.severity} alert` : "All clear"}
            />
          </motion.section>

          {insight ? (
            <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-base leading-7 text-zinc-300">
              <span className="font-semibold text-orange-300">This month: </span>
              {insight}
            </p>
          ) : null}

          <div className="grid gap-10 xl:grid-cols-[1.15fr_1fr] xl:gap-6">
            <section className="min-w-0" data-tour-id="dashboard-overload">
              <SectionTitle linkLabel="All suggestions" title="Next session" to="/overload" />
              {overloadRecommendations.length ? (
                <ul className="space-y-2">
                  {overloadRecommendations.slice(0, 3).map((item) => {
                    const up = Number(item.recommendedWeight) > Number(item.currentWeight);
                    return (
                      <li key={item._id || item.exerciseName}>
                        <Link
                          className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                          to="/overload"
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                              up ? "bg-forge-ember/15 text-orange-300" : "bg-white/[0.06] text-zinc-300"
                            }`}
                          >
                            {up ? <OverloadIcon className="h-5 w-5" /> : <DeloadIcon className="h-5 w-5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-white">{item.exerciseName}</span>
                            <span className="block truncate text-sm text-zinc-400">{item.recommendedRepTarget ? `${item.recommendedRepTarget} reps` : item.reason}</span>
                          </span>
                          {item.recommendedWeight ? (
                            <span className="shrink-0 text-right">
                              <span className="font-display block text-lg tabular-nums text-white">
                                {formatNumber(item.recommendedWeight)} {unit}
                              </span>
                              {item.currentWeight && item.currentWeight !== item.recommendedWeight ? (
                                <span className="block text-xs tabular-nums text-zinc-500">
                                  from {formatNumber(item.currentWeight)} {unit}
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/12 p-5 text-base text-zinc-400">
                  Log a few workouts and ForgeLift will suggest the weight for your next session.
                </p>
              )}
            </section>

            <section className="min-w-0">
              <SectionTitle linkLabel="Recovery" title="Muscles today" to="/recovery" />
              {muscleTiles.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {muscleTiles.map((score) => (
                    <MuscleTile key={score.muscleGroup} score={score} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/12 p-5 text-base text-zinc-400">
                  Recovery scores show up after your first logged workout.
                </p>
              )}
            </section>
          </div>

          <section data-tour-id="dashboard-path-to-max">
            <SectionTitle linkLabel={weakPoints.length ? `All ${weakPoints.length}` : ""} title={`Path to ${nextRank || "the top"}`} to={weakPoints.length ? "/weak-points" : undefined} />
            {weakPoints.length ? (
              <>
                <p className="-mt-2 mb-4 max-w-3xl text-base leading-7 text-zinc-400">
                  {progress.pointsToNextRank
                    ? `${formatNumber(progress.pointsToNextRank)} points to ${nextRank}. Your overall rank averages your trained muscles, so the weakest ones pull it down most.`
                    : "You're at the top rank. These are the muscles still lagging behind the rest."}
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {weakPoints.slice(0, 3).map((weakPoint) => (
                    <WeakPointCard key={weakPoint._id} weakPoint={weakPoint} />
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-base text-zinc-300">
                Nothing is holding you back right now. Keep training and logging consistently.
              </p>
            )}
          </section>

          <section>
            <SectionTitle linkLabel="History" title="Recent sessions" to="/workouts" />
            <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
              {recentWorkouts.length ? (
                <ul className="min-w-0 space-y-2">
                  {recentWorkouts.map((workout) => {
                    const muscles = Object.keys(workout.muscleLoadSummary || workout.muscleVolumeSummary || {});
                    return (
                      <li key={workout._id}>
                        <Link
                          className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                          to={`/workouts/${workout._id}`}
                        >
                          <span className="w-12 shrink-0 text-center leading-tight">
                            <span className="block text-xs font-semibold uppercase text-zinc-500">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(workout.date))}</span>
                            <span className="font-display block text-lg text-white">{new Date(workout.date).getDate()}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-white">{workout.title}</span>
                            <span className="block truncate text-sm text-zinc-400">{muscles.length ? muscles.slice(0, 4).join(", ") : "No muscles listed"}</span>
                          </span>
                          <span className="shrink-0 text-right text-sm tabular-nums text-zinc-300">
                            {formatNumber(workout.totalVolume)} {unit}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/12 p-6 text-center">
                  <p className="font-semibold text-white">Your training log is empty.</p>
                  <p className="mt-1 text-sm text-zinc-400">Start Gym Mode to record your first session.</p>
                </div>
              )}
              <Link
                className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[radial-gradient(120%_120%_at_100%_0%,rgba(249,115,22,0.12),transparent_60%)] p-5 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/progress/prs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-400">Latest PR</p>
                  <MedalIcon className="h-5 w-5 text-orange-300" />
                </div>
                <div className="mt-4">
                  <p className="font-display text-2xl text-white">{latestPR?.exerciseName || "None yet"}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {latestPR ? (
                      <>
                        <span className="capitalize">{(latestPR.recordType || "record").replaceAll("_", " ").replace("1rm", "1RM")}</span>
                        {latestPR.date ? `, ${formatDate(latestPR.date)}` : ""}
                      </>
                    ) : (
                      "PRs appear here as you log workouts."
                    )}
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default DashboardPage;
