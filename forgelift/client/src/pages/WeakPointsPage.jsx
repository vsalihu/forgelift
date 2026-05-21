import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import WeakPointCard from "../components/weakPoints/WeakPointCard.jsx";
import { weakPointService } from "../services/weakPointService.js";
import { helpText } from "../utils/helpText.js";

const WeakPointsPage = () => {
  const [weakPoints, setWeakPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadWeakPoints = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await weakPointService.getWeakPoints();
      setWeakPoints(data.weakPoints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeakPoints();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    setError("");

    try {
      const data = await weakPointService.recalculateWeakPoints();
      setWeakPoints(data.weakPoints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Weak Points</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Training gaps and imbalances <HelpTooltip {...helpText.weakPoint} />
          </h1>
        </div>
        <Button loading={recalculating} onClick={recalculate}>
          Recalculate weak points
        </Button>
      </div>

      {loading ? <p className="text-forge-steel">Loading weak points...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>Severity <HelpTooltip title="Severity" content="How important ForgeLift thinks the weak point is right now." example="Critical means it should be addressed soon." size="xs" /></span>
        <span>Evidence <HelpTooltip title="Evidence" content="The workout data ForgeLift used to detect the weak point." example="Low direct shoulder volume or push volume much higher than pull volume." size="xs" /></span>
        <span>Recommendation <HelpTooltip title="Recommendation" content="A practical next step to fix the weak point." example="Add rows, pulldowns, or direct shoulder work this week." size="xs" /></span>
      </div>

      {!loading && !error && weakPoints.length === 0 ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-forge-copper" />
          <p className="text-lg font-bold text-white">No weak point data yet.</p>
          <p className="mt-2 text-slate-400">Log workouts to start detecting imbalances.</p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {weakPoints.map((weakPoint) => (
          <WeakPointCard key={weakPoint._id} weakPoint={weakPoint} />
        ))}
      </section>
    </Layout>
  );
};

export default WeakPointsPage;
