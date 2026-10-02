import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnalyticsOverviewCards from "../components/analytics/AnalyticsOverviewCards.jsx";
import AnalyticsTabs from "../components/analytics/AnalyticsTabs.jsx";
import InsightList from "../components/analytics/InsightList.jsx";
import PeriodSelector from "../components/analytics/PeriodSelector.jsx";
import BodyweightChart from "../components/analytics/progress/BodyweightChart.jsx";
import ConsistencyHeatmap from "../components/analytics/progress/ConsistencyHeatmap.jsx";
import FatigueProgressChart from "../components/analytics/progress/FatigueProgressChart.jsx";
import MuscleBalanceRadar from "../components/analytics/progress/MuscleBalanceRadar.jsx";
import MuscleVolumeChart from "../components/analytics/progress/MuscleVolumeChart.jsx";
import PrTimelineChart from "../components/analytics/progress/PrTimelineChart.jsx";
import ProjectionSummary from "../components/analytics/progress/ProjectionSummary.jsx";
import RankJourneyChart from "../components/analytics/progress/RankJourneyChart.jsx";
import StrengthProjectionChart from "../components/analytics/progress/StrengthProjectionChart.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import { GoalIcon, InfoIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon } from "../components/icons/navIcons.jsx";
import Layout from "../components/Layout.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { advancedAnalyticsService } from "../services/advancedAnalyticsService.js";

const SectionHeading = ({ eyebrow, title }) => (
  <div className="mb-4 mt-12 first:mt-0">
    <p className="text-sm font-semibold text-orange-300">{eyebrow}</p>
    <h2 className="font-display mt-0.5 text-2xl text-white sm:text-3xl">{title}</h2>
  </div>
);

const formatType = (type = "") => type.replaceAll("_", " ");

const AdvancedAnalyticsPage = () => {
  const [period, setPeriod] = useState("180d");
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedLiftName, setSelectedLiftName] = useState("");
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalError, setGoalError] = useState("");

  const loadAnalytics = useCallback(async (nextPeriod) => {
    setRefreshing(true);
    setError("");
    try {
      const [overviewData, insightData, progressData] = await Promise.all([
        advancedAnalyticsService.getAnalyticsOverview(nextPeriod),
        advancedAnalyticsService.getInsights(nextPeriod),
        advancedAnalyticsService.getProgress(nextPeriod)
      ]);
      setOverview(overviewData.overview);
      setInsights(insightData);
      setProgress(progressData.progress);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(period);
  }, [period, loadAnalytics]);

  const lifts = progress?.lifts || [];
  const selectedLift = lifts.find((lift) => lift.exerciseName === selectedLiftName) || lifts[0];
  const unit = progress?.unit || "kg";

  const refreshProgress = async () => {
    const progressData = await advancedAnalyticsService.getProgress(period);
    setProgress(progressData.progress);
  };

  const saveGoal = async (exerciseName, target) => {
    setGoalBusy(true);
    setGoalError("");
    try {
      await advancedAnalyticsService.setGoal(exerciseName, target);
      setSelectedLiftName(exerciseName);
      await refreshProgress();
    } catch (err) {
      setGoalError(err.message);
    } finally {
      setGoalBusy(false);
    }
  };

  const removeGoal = async (exerciseName) => {
    setGoalBusy(true);
    setGoalError("");
    try {
      await advancedAnalyticsService.removeGoal(exerciseName);
      await refreshProgress();
    } catch (err) {
      setGoalError(err.message);
    } finally {
      setGoalBusy(false);
    }
  };

  const latestPR = insights?.prInsights?.latestPR;
  const bestPR = insights?.prInsights?.bestPR;
  const facts = [
    latestPR ? `Latest record: ${latestPR.exerciseName}, ${formatType(latestPR.recordType)}.` : "No records in this period yet.",
    bestPR ? `Biggest record this period: ${bestPR.exerciseName} at ${bestPR.value}.` : null,
    `Average recovery: ${insights?.recoveryTrends?.averageRecoveryScore || 0}%.`,
    `Missions completed: ${insights?.missionInsights?.completionPercentage || 0}%.`,
    `Training balance: ${insights?.balanceInsights?.score || 0}/100${insights?.balanceInsights?.status ? `, ${insights.balanceInsights.status.toLowerCase()}` : ""}.`,
    insights?.balanceInsights?.mainWarning || null
  ].filter(Boolean);
  const noData = overview?.totalWorkouts === 0 && !lifts.length;

  return (
    <Layout>
      <AnalyticsTabs />
      <PageHeader
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
        description="How your strength, rank and training are trending, and where they're likely to be in a few months."
        eyebrow="Trends"
        title="Where you're heading"
        tutorialPageKey="analytics"
      />

      {error ? <ErrorState message={error} onRetry={() => loadAnalytics(period)} /> : null}

      {loading ? (
        <div aria-busy="true" className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div className="h-28 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />
        </div>
      ) : null}

      {!loading && progress ? (
        <div aria-busy={refreshing} className={`transition-opacity duration-300 ${refreshing ? "opacity-60" : ""}`} data-tour-id="analytics-overview">
          {noData ? (
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.12] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-xl text-white">Nothing to chart yet.</p>
                <p className="mt-1 text-sm text-zinc-300">Log a few workouts and these charts start filling in.</p>
              </div>
              <Link className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02]" to="/gym-mode">
                <GymModeIcon aria-hidden="true" className="h-4 w-4" />
                Start a workout
              </Link>
            </div>
          ) : null}

          <ProjectionSummary progress={progress} selectedLift={selectedLift} />

          <Explainer className="mt-3" title="How projections work">
            <p className="text-sm leading-6 text-zinc-400">
              ForgeLift draws a trend line through your last 8 weeks and extends it forward. Gains slow down as you get stronger, faster for experienced
              lifters, so projections curve instead of rising forever. The shaded range widens the further ahead it looks.
            </p>
          </Explainer>

          <SectionHeading eyebrow="Strength" title="Your lifts" />
          <div className="space-y-4">
            <StrengthProjectionChart
              goalBusy={goalBusy}
              goalError={goalError}
              lifts={lifts}
              selectedLiftName={selectedLift?.exerciseName}
              unit={unit}
              onRemoveGoal={removeGoal}
              onSaveGoal={saveGoal}
              onSelectLift={(name) => {
                setGoalError("");
                setSelectedLiftName(name);
              }}
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <PrTimelineChart unit={unit} weeks={progress.prTimeline} />
              <BodyweightChart bodyweight={progress.bodyweight} lift={selectedLift} unit={unit} />
            </div>
          </div>

          <SectionHeading eyebrow="Rank" title="Your climb" />
          <RankJourneyChart rankJourney={progress.rankJourney} />

          <SectionHeading eyebrow="Training" title="How you've been training" />
          <div className="space-y-4">
            <ConsistencyHeatmap consistency={progress.consistency} />
            <FatigueProgressChart weeks={progress.fatigueVsProgress} />
            <div className="grid gap-4 xl:grid-cols-2">
              <MuscleVolumeChart weeks={progress.volumeByMuscle} />
              <MuscleBalanceRadar balance={progress.muscleBalance} />
            </div>
          </div>

          <SectionHeading eyebrow="This period" title="In numbers" />
          <AnalyticsOverviewCards overview={overview} unit={unit} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InsightList icon={GoalIcon} items={insights?.recommendations || []} numbered title="What to work on" />
            <InsightList icon={InfoIcon} items={facts} title="Worth knowing" />
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default AdvancedAnalyticsPage;
