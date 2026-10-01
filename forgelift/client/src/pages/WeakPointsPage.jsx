import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import RefreshButton from "../components/advice/RefreshButton.jsx";
import StatusChip from "../components/advice/StatusChip.jsx";
import { severityTone } from "../components/advice/tones.js";
import WeakPointCard from "../components/weakPoints/WeakPointCard.jsx";
import { SuccessIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon, WeakPointsIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { weakPointService } from "../services/weakPointService.js";

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const WeakPointsPage = () => {
  const [weakPoints, setWeakPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const loadWeakPoints = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await weakPointService.getWeakPoints();
      setWeakPoints(data.weakPoints || []);
      setLoaded(true);
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

  const sorted = useMemo(() => [...weakPoints].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)), [weakPoints]);
  const counts = useMemo(() => {
    const tally = {};
    weakPoints.forEach((item) => {
      tally[item.severity || "Low"] = (tally[item.severity || "Low"] || 0) + 1;
    });
    return tally;
  }, [weakPoints]);
  const [top, ...rest] = sorted;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={<RefreshButton busy={recalculating} onClick={recalculate} />}
          description="Gaps and imbalances in your training that hold back your rank and your physique, with a fix for each."
          eyebrow="Weak points"
          title="What's holding you back"
          tutorialPageKey="weak_points"
        />

        {error ? <ErrorState message={error} onRetry={loadWeakPoints} /> : null}
        {loading ? <LoadingBlocks hero="h-56" label="Loading weak points" /> : null}

        {!loading && !error && loaded && !weakPoints.length ? (
          <EmptyPanel icon={WeakPointsIcon} title="No weak points found.">
            Either your training is well balanced, or there isn't enough of it yet. Keep logging and ForgeLift keeps checking.
          </EmptyPanel>
        ) : null}

        {!loading && top ? (
          <>
            <AdviceHero glow="bg-orange-500/15" tourId="weak-points-overview">
              <p className="text-sm font-semibold text-orange-300">Biggest gap</p>
              <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
                <WeakPointCard featured weakPoint={top} />
                <div className="lg:pt-2">
                  <h2 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                    {weakPoints.length} {weakPoints.length === 1 ? "thing" : "things"} to fix
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {Object.keys(SEVERITY_ORDER)
                      .filter((severity) => counts[severity])
                      .map((severity) => (
                        <li key={severity}>
                          <StatusChip tone={severityTone(severity)}>
                            {counts[severity]} {severity.toLowerCase()}
                          </StatusChip>
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">Your overall rank averages every muscle, so lifting the weakest ones moves it fastest. Start with the most severe.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02]" to="/gym-mode">
                      <GymModeIcon className="h-4 w-4" />
                      Train now
                    </Link>
                    <Link className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white" to="/training-balance">
                      See balance
                    </Link>
                  </div>
                </div>
              </div>
            </AdviceHero>

            {rest.length ? (
              <section aria-labelledby="weak-rest" className="mt-10">
                <h2 className="font-display mb-4 text-2xl text-white" id="weak-rest">
                  Also worth fixing
                </h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {rest.map((weakPoint, index) => (
                    <WeakPointCard index={index} key={weakPoint._id} weakPoint={weakPoint} />
                  ))}
                </div>
              </section>
            ) : (
              <p className="mt-6 flex items-center gap-2 text-sm text-emerald-200">
                <SuccessIcon className="h-4 w-4" />
                That's the only one. Fix it and you're balanced.
              </p>
            )}

            <Explainer
              className="mt-8"
              items={[
                ["Severity", "How much this gap matters right now. Critical ones should be fixed this week."],
                ["Rank gap", "How many ranks a muscle sits below your strongest one."],
                ["Direct vs indirect", "Indirect work (triceps on bench) tires a muscle but builds it less than direct work."],
                ["Ratios", "Push vs pull, upper vs lower, front vs rear. Around 1x is balanced."]
              ]}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default WeakPointsPage;
