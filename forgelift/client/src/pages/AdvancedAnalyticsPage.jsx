import { useCallback, useEffect, useState } from "react";
import AnalyticsOverviewCards from "../components/analytics/AnalyticsOverviewCards.jsx";
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
import Layout from "../components/Layout.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { advancedAnalyticsService } from "../services/advancedAnalyticsService.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

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

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Analytics</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Progress &amp; projections{" "}
            <HelpTooltip
              title="How projections work"
              content="ForgeLift draws a trend line through your last 8 weeks and extends it forward. Gains are assumed to slow down over time, faster for experienced lifters, so projections curve instead of rising forever. The shaded range widens the further ahead it looks."
            />
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <TutorialLauncher pageKey="analytics" steps={getTutorialSteps("analytics")} />
        </div>
      </div>

      {loading ? <p className="text-forge-steel">Loading analytics...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && progress ? (
        <div className={`space-y-6 transition-opacity ${refreshing ? "opacity-60" : ""}`} data-tour-id="analytics-overview">
          {overview?.totalWorkouts === 0 && !lifts.length ? (
            <div className="metal-panel rounded-lg p-8 text-center text-slate-400">
              No analytics yet. Log workouts to start building progress insights.
            </div>
          ) : null}

          <ProjectionSummary progress={progress} selectedLift={selectedLift} />

          <StrengthProjectionChart
            goalBusy={goalBusy}
            goalError={goalError}
            lifts={lifts}
            selectedLiftName={selectedLift?.exerciseName}
            unit={progress.unit}
            onRemoveGoal={removeGoal}
            onSaveGoal={saveGoal}
            onSelectLift={(name) => {
              setGoalError("");
              setSelectedLiftName(name);
            }}
          />

          <RankJourneyChart rankJourney={progress.rankJourney} />

          <ConsistencyHeatmap consistency={progress.consistency} />

          <FatigueProgressChart weeks={progress.fatigueVsProgress} />

          <div className="grid gap-6 xl:grid-cols-2">
            <MuscleVolumeChart weeks={progress.volumeByMuscle} />
            <MuscleBalanceRadar balance={progress.muscleBalance} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <BodyweightChart bodyweight={progress.bodyweight} lift={selectedLift} unit={progress.unit} />
            <PrTimelineChart unit={progress.unit} weeks={progress.prTimeline} />
          </div>

          <AnalyticsOverviewCards overview={overview} />

          <div className="grid gap-6 xl:grid-cols-3">
            <InsightList title="Recommendations" items={insights?.recommendations || []} />
            <InsightList
              title="PR insights"
              items={[
                insights?.prInsights?.latestPR
                  ? `Latest PR: ${insights.prInsights.latestPR.exerciseName} ${insights.prInsights.latestPR.recordType.replaceAll("_", " ")}`
                  : "No PRs yet.",
                insights?.prInsights?.bestPR
                  ? `Best PR value this period: ${insights.prInsights.bestPR.exerciseName} ${insights.prInsights.bestPR.value}`
                  : "No best PR yet."
              ]}
            />
            <InsightList
              title="Recovery, missions, and balance"
              items={[
                `Average recovery score: ${insights?.recoveryTrends?.averageRecoveryScore || 0}%`,
                `Mission completion: ${insights?.missionInsights?.completionPercentage || 0}%`,
                `Training balance: ${insights?.balanceInsights?.score || 0}/100 ${insights?.balanceInsights?.status || ""}`,
                insights?.balanceInsights?.mainWarning || "No major balance warning."
              ]}
            />
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default AdvancedAnalyticsPage;
