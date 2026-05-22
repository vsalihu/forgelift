import { useEffect, useState } from "react";
import AnalyticsOverviewCards from "../components/analytics/AnalyticsOverviewCards.jsx";
import InsightList from "../components/analytics/InsightList.jsx";
import MuscleLoadChart from "../components/analytics/MuscleLoadChart.jsx";
import PeriodSelector from "../components/analytics/PeriodSelector.jsx";
import StrengthTrendChart from "../components/analytics/StrengthTrendChart.jsx";
import VolumeTrendChart from "../components/analytics/VolumeTrendChart.jsx";
import Layout from "../components/Layout.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { advancedAnalyticsService } from "../services/advancedAnalyticsService.js";
import { helpText } from "../utils/helpText.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const AdvancedAnalyticsPage = () => {
  const [period, setPeriod] = useState("month");
  const [overview, setOverview] = useState(null);
  const [volumeTrends, setVolumeTrends] = useState(null);
  const [strengthTrends, setStrengthTrends] = useState([]);
  const [muscleLoadDistribution, setMuscleLoadDistribution] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const [overviewData, volumeData, strengthData, muscleData, insightData] = await Promise.all([
          advancedAnalyticsService.getAnalyticsOverview(period),
          advancedAnalyticsService.getVolumeTrends(period),
          advancedAnalyticsService.getStrengthTrends(period),
          advancedAnalyticsService.getMuscleLoadDistribution(period),
          advancedAnalyticsService.getInsights(period)
        ]);
        setOverview(overviewData.overview);
        setVolumeTrends(volumeData.volumeTrends);
        setStrengthTrends(strengthData.strengthTrends || []);
        setMuscleLoadDistribution(muscleData.muscleLoadDistribution || []);
        setInsights(insightData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [period]);

  const primaryStrengthTrend = strengthTrends[0];

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Advanced Analytics</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Progress insights <HelpTooltip title="Progress Insights" content="Long-term summaries that help you see what is improving and what needs attention." />
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <TutorialLauncher pageKey="analytics" steps={getTutorialSteps("analytics")} />
        </div>
      </div>

      {loading ? <p className="text-forge-steel">Loading advanced analytics...</p> : null}
      {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div data-tour-id="analytics-overview">
          {overview?.totalWorkouts === 0 ? (
            <div className="metal-panel rounded-lg p-8 text-center text-slate-400">
              No analytics yet. Log workouts to start building progress insights.
            </div>
          ) : null}
          </div>

          <AnalyticsOverviewCards overview={overview} />

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">Volume trend <HelpTooltip {...helpText.volume} /></h2>
              <VolumeTrendChart data={volumeTrends?.byWeek?.length ? volumeTrends.byWeek : volumeTrends?.byMonth || []} />
            </section>
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-4 text-xl font-bold text-white">
                Strength trend {primaryStrengthTrend ? `- ${primaryStrengthTrend.exerciseName}` : ""} <HelpTooltip {...helpText.strengthTrend} />
              </h2>
              <StrengthTrendChart trend={primaryStrengthTrend} />
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="metal-panel rounded-lg p-5">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">Muscle load distribution <HelpTooltip {...helpText.muscleLoadDistribution} /></h2>
              <MuscleLoadChart data={muscleLoadDistribution} />
            </section>
            <InsightList title="Recommendations" items={insights?.recommendations || []} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
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
