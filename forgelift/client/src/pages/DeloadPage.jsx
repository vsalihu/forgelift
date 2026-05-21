import { useEffect, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import Button from "../components/Button.jsx";
import DeloadRecommendationCard from "../components/deload/DeloadRecommendationCard.jsx";
import FatigueSummaryCard from "../components/deload/FatigueSummaryCard.jsx";
import PlateauCard from "../components/deload/PlateauCard.jsx";
import Layout from "../components/Layout.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { deloadService } from "../services/deloadService.js";
import { helpText } from "../utils/helpText.js";

const DeloadPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [plateaus, setPlateaus] = useState([]);
  const [fatigue, setFatigue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [deloadData, plateauData, fatigueData] = await Promise.all([
        deloadService.getDeloadRecommendations(),
        deloadService.getPlateaus(),
        deloadService.getFatigue()
      ]);
      setRecommendations(deloadData.recommendations || []);
      setPlateaus(plateauData.plateaus || []);
      setFatigue(fatigueData.fatigueSummary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError("");

    try {
      const data = await deloadService.recalculateDeload();
      setRecommendations(data.deloadRecommendations || []);
      setPlateaus(data.plateauSummary || []);
      setFatigue(data.fatigueSummary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await deloadService.updateDeloadStatus(id, status);
      setRecommendations((current) => current.filter((recommendation) => recommendation._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Smart Deload</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Plateau and fatigue control <HelpTooltip {...helpText.deload} />
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            ForgeLift checks recent performance, RPE, failed sets, recovery, overload warnings, and volume spikes
            before recommending when to stop pushing.
          </p>
        </div>
        <Button loading={recalculating} type="button" onClick={handleRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>

      {user?.beginnerTipsEnabled !== false ? (
        <div className="mb-6">
          <BeginnerTip title="Deloads are a progression tool">
            A deload does not mean you are weak. It is a planned easier period to recover and keep progressing.
          </BeginnerTip>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>Plateau <HelpTooltip {...helpText.plateau} size="xs" /></span>
        <span>Fatigue <HelpTooltip title="Fatigue" content="Fatigue is accumulated tiredness from hard training, high RPE, poor recovery, or volume spikes." example="Several high-RPE sessions in a row can raise fatigue." size="xs" /></span>
        <span>Technique reset <HelpTooltip title="Technique Reset" content="A lighter session focused on clean reps and control." example="Reduce weight and rebuild form before pushing again." size="xs" /></span>
        <span>Full body deload <HelpTooltip title="Full Body Deload" content="A short easier week when many muscle groups show fatigue." example="Reduce total training volume by 30% to 50% for a week." size="xs" /></span>
      </div>

      {loading ? <p className="text-forge-steel">Loading deload data...</p> : null}
      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <FatigueSummaryCard fatigue={fatigue} />

          <section className="metal-panel rounded-lg p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Active Plans</p>
                <h2 className="mt-2 text-xl font-black text-white">Deload recommendations</h2>
              </div>
            </div>
            {recommendations.length ? (
              <div className="space-y-5">
                {recommendations.map((recommendation) => (
                  <DeloadRecommendationCard
                    key={recommendation._id}
                    recommendation={recommendation}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-white/15 p-8 text-center">
                <ShieldAlert className="mx-auto h-10 w-10 text-forge-copper" />
                <h3 className="mt-4 text-lg font-bold text-white">No deload needed right now</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Your recent training does not show strong plateau or fatigue signals.
                </p>
              </div>
            )}
          </section>

          <section className="metal-panel rounded-lg p-5">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Plateaus</p>
              <h2 className="mt-2 text-xl font-black text-white">Exercise trend checks</h2>
            </div>
            {plateaus.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {plateaus.map((plateau) => (
                  <PlateauCard key={plateau.exerciseName} plateau={plateau} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-white/15 p-5 text-center text-slate-400">
                No exercise plateau detected. ForgeLift waits for at least 3 sessions before flagging a plateau.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default DeloadPage;
