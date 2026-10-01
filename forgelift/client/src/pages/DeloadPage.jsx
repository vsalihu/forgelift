import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import RefreshButton from "../components/advice/RefreshButton.jsx";
import { tone as getTone } from "../components/advice/tones.js";
import DeloadCard from "../components/deload/DeloadCard.jsx";
import PlateauRow from "../components/deload/PlateauRow.jsx";
import { SuccessIcon } from "../components/icons/featureIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { deloadService } from "../services/deloadService.js";

const LEVELS = [
  { name: "Low", tone: "good" },
  { name: "Medium", tone: "caution" },
  { name: "High", tone: "serious" },
  { name: "Critical", tone: "critical" }
];

const FatigueMeter = ({ level }) => {
  const index = Math.max(0, LEVELS.findIndex((item) => item.name === level));
  return (
    <div>
      <div aria-label={`Fatigue ${level}, ${index + 1} of 4`} className="grid grid-cols-4 gap-1" role="img">
        {LEVELS.map((item, itemIndex) => (
          <span className={`h-2 rounded-full ${itemIndex <= index ? getTone(LEVELS[index].tone).bar : "bg-white/[0.08]"}`} key={item.name} />
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 grid grid-cols-4 gap-1 text-[0.7rem] text-zinc-500">
        {LEVELS.map((item, itemIndex) => (
          <span className={itemIndex === index ? "font-bold text-zinc-200" : ""} key={item.name}>
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
};

const DeloadPage = () => {
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
      const [deloadData, plateauData, fatigueData] = await Promise.all([deloadService.getDeloadRecommendations(), deloadService.getPlateaus(), deloadService.getFatigue()]);
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

  const level = fatigue?.fatigueLevel || "Low";
  const calm = !recommendations.length && level === "Low";

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={<RefreshButton busy={recalculating} onClick={handleRecalculate} />}
          description="ForgeLift watches effort, failed sets, recovery and stalled lifts, and tells you when an easier week will move you forward."
          eyebrow="Deload"
          title="Time to back off?"
          tutorialPageKey="deload"
        />

        {error ? <ErrorState message={error} onRetry={loadData} /> : null}
        {loading ? <LoadingBlocks hero="h-48" label="Loading deload data" /> : null}

        {!loading && !error ? (
          <>
            <AdviceHero glow={calm ? "bg-emerald-400/15" : "bg-orange-500/20"}>
              <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className={`text-sm font-semibold ${calm ? "text-emerald-300" : "text-orange-300"}`}>Fatigue</p>
                  <h2 className="font-display mt-1 text-3xl leading-tight text-white sm:text-4xl">
                    {calm ? "No deload needed." : recommendations.length ? `${recommendations.length} ${recommendations.length === 1 ? "area needs" : "areas need"} an easier week.` : `${level} fatigue building up.`}
                  </h2>
                  <div className="mt-5 max-w-sm">
                    <FatigueMeter level={level} />
                  </div>
                </div>
                <div>
                  {fatigue?.affectedMuscles?.length ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Most affected</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {fatigue.affectedMuscles.map((muscle) => (
                          <li className="rounded-full bg-red-500/[0.12] px-3 py-1 text-sm font-semibold text-red-100" key={muscle}>
                            {muscle}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {fatigue?.reasons?.length ? (
                    <ul className="mt-4 space-y-1.5 text-sm leading-6 text-zinc-300">
                      {fatigue.reasons.slice(0, 4).map((reason) => (
                        <li className="flex gap-2" key={reason}>
                          <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-orange-300" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-6 text-zinc-400">No pattern of accumulating fatigue in your recent training. Keep pushing.</p>
                  )}
                </div>
              </div>
            </AdviceHero>

            <section aria-labelledby="deload-plans" className="mt-10" data-tour-id="deload-active">
              <h2 className="font-display mb-4 text-2xl text-white" id="deload-plans">
                Deload plans
              </h2>
              {recommendations.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {recommendations.map((recommendation) => (
                    <DeloadCard key={recommendation._id} recommendation={recommendation} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4 text-sm text-emerald-100">
                  <SuccessIcon className="h-5 w-5 shrink-0 text-emerald-300" />
                  Nothing to deload right now. Your recent training shows no strong plateau or fatigue signals.
                </div>
              )}
            </section>

            <section aria-labelledby="deload-plateau-heading" className="mt-10" data-tour-id="deload-plateaus">
              <h2 className="font-display text-2xl text-white" id="deload-plateau-heading">
                Stalled lifts
              </h2>
              <p className="mb-4 mt-1 text-sm text-zinc-500">Lifts whose estimated max has stopped climbing across at least 3 sessions.</p>
              {plateaus.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {plateaus.map((plateau) => (
                    <PlateauRow key={plateau.exerciseName} plateau={plateau} />
                  ))}
                </div>
              ) : (
                <p className="rounded-3xl border border-dashed border-white/12 p-5 text-center text-sm text-zinc-400">No stalled lifts. Everything you've logged at least 3 times is still moving.</p>
              )}
            </section>

            <Explainer
              className="mt-8"
              items={[
                ["Deload", "A short, planned easier stretch. Not a sign of weakness: it's how you keep progressing."],
                ["Plateau", "Your estimated max on a lift has stayed flat or dropped for several sessions."],
                ["Technique reset", "A lighter session spent on clean, controlled reps before pushing again."],
                ["Full-body deload", "When many muscles show fatigue: cut total volume by 30 to 50% for about a week."]
              ]}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default DeloadPage;
