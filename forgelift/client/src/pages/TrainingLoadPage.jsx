import { useEffect, useState } from "react";
import { AlertTriangle, Flame, TrendingUp, Weight } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import TrainingLoadCard from "../components/trainingLoad/TrainingLoadCard.jsx";
import IconMetricCard from "../components/visuals/IconMetricCard.jsx";
import VisualSummaryGrid from "../components/visuals/VisualSummaryGrid.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { trainingLoadService } from "../services/trainingLoadService.js";

const BROAD_MUSCLES = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Full Body"];

const TrainingLoadPage = () => {
  const { user } = useAuth();
  const [trainingLoad, setTrainingLoad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailed, setShowDetailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await trainingLoadService.getTrainingLoad();
      setTrainingLoad(data.trainingLoad || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dataAvailable = trainingLoad.filter((item) => item.dataAvailable);
  const noData = trainingLoad.filter((item) => !item.dataAvailable);
  const visibleDataAvailable = showDetailed ? dataAvailable : dataAvailable.filter((item) => BROAD_MUSCLES.includes(item.muscleGroup));
  const visibleNoData = showDetailed ? noData : noData.filter((item) => BROAD_MUSCLES.includes(item.muscleGroup));

  const realProgressCount = dataAvailable.filter((item) => item.quadrant === "Real Progress").length;
  const atRiskCount = dataAvailable.filter((item) => item.quadrant === "Overreaching" || item.quadrant === "Fatigued Without Gains").length;
  const avgStrengthTrend = dataAvailable.length
    ? Math.round(
        (dataAvailable.reduce((sum, item) => sum + (item.strengthTrendPercent || 0), 0) / dataAvailable.length) * 10
      ) / 10
    : null;

  return (
    <Layout>
      <PageHeader
        eyebrow="Intelligence"
        title="Training Load"
        description="Fatigue and progress together: how hard each muscle is being pushed relative to its normal pattern, and whether that effort is actually making it stronger."
      />

      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {user?.beginnerTipsEnabled !== false ? (
        <div className="mb-6">
          <BeginnerTip title="Why this is different from Recovery">
            Recovery tells you if a muscle is ready to train again today. Training Load looks further back: is your
            recent training load sustainable (ACWR), and is your strength on that muscle actually trending up? A
            muscle can be "recovered" for tomorrow's session and still be in an unsustainable pattern overall.
          </BeginnerTip>
        </div>
      ) : null}

      <button
        className="mb-6 text-sm font-semibold text-forge-ember hover:text-orange-300"
        type="button"
        onClick={() => setShowDetailed(!showDetailed)}
      >
        {showDetailed ? "Show broad muscle groups" : "Show detailed muscles"}
      </button>

      {loading ? <p className="text-forge-steel">Loading training load...</p> : null}

      {!loading && !error && !trainingLoad.length ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <p className="text-lg font-bold text-white">No training load data yet.</p>
          <p className="mt-2 text-slate-400">Log a few weeks of workouts so ForgeLift can compare your recent load to your normal pattern.</p>
        </div>
      ) : null}

      {trainingLoad.length ? (
        <VisualSummaryGrid className="mb-6">
          <IconMetricCard icon={TrendingUp} label="Real progress" value={realProgressCount} status="Muscles getting stronger sustainably" variant="success" />
          <IconMetricCard icon={AlertTriangle} label="At risk" value={atRiskCount} status="Overreaching or fatigued without gains" variant={atRiskCount ? "danger" : "success"} />
          <IconMetricCard icon={Flame} label="Avg strength trend" value={avgStrengthTrend === null ? "--" : `${avgStrengthTrend > 0 ? "+" : ""}${avgStrengthTrend}%`} status="Across tracked muscles" variant="info" />
          <IconMetricCard icon={Weight} label="Tracked muscles" value={trainingLoad.length} status="Training load cards below" variant="neutral" />
        </VisualSummaryGrid>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleDataAvailable.map((item) => (
          <TrainingLoadCard key={item.muscleGroup} trainingLoad={item} />
        ))}
      </section>

      {visibleNoData.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black text-white">Not enough data yet</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleNoData.map((item) => (
              <TrainingLoadCard key={item.muscleGroup} trainingLoad={item} />
            ))}
          </div>
        </section>
      ) : null}
    </Layout>
  );
};

export default TrainingLoadPage;
