import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import MuscleAvoidList from "../components/recovery/MuscleAvoidList.jsx";
import RecoveryCard from "../components/recovery/RecoveryCard.jsx";
import TodayRecommendationCard from "../components/recovery/TodayRecommendationCard.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import IconMetricCard from "../components/visuals/IconMetricCard.jsx";
import VisualSummaryGrid from "../components/visuals/VisualSummaryGrid.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { recoveryService } from "../services/recoveryService.js";
import { helpText } from "../utils/helpText.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";
import { Activity, AlertTriangle, Dumbbell, HeartPulse } from "lucide-react";

const RecoveryPage = () => {
  const { user } = useAuth();
  const [recoveryScores, setRecoveryScores] = useState([]);
  const [todayRecommendation, setTodayRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [showDetailedMuscles, setShowDetailedMuscles] = useState(false);

  const loadRecovery = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await recoveryService.getTodayRecommendation();
      setRecoveryScores(data.recoveryScores || []);
      setTodayRecommendation(data.todayRecommendation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecovery();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    setError("");

    try {
      const data = await recoveryService.recalculateRecovery();
      setRecoveryScores(data.recoveryScores || []);
      setTodayRecommendation(data.todayRecommendation);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const scoresWithData = recoveryScores.filter((score) => score.dataAvailable !== false && score.score !== null && score.score !== undefined);
  const noDataScores = recoveryScores.filter((score) => score.dataAvailable === false || score.score === null || score.score === undefined);
  const hasRecoveryData = scoresWithData.length > 0;
  const broadRecoveryMuscles = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Cardio", "Full Body"];
  const visibleScoresWithData = showDetailedMuscles
    ? scoresWithData
    : scoresWithData.filter((score) => broadRecoveryMuscles.includes(score.muscleGroup));
  const visibleNoDataScores = showDetailedMuscles
    ? noDataScores
    : noDataScores.filter((score) => broadRecoveryMuscles.includes(score.muscleGroup));
  const readyMuscles = scoresWithData.filter((score) => score.score >= 75).map((score) => score.muscleGroup);
  const avoidMuscles = scoresWithData.filter((score) => score.score < 60).map((score) => score.muscleGroup);

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Recovery</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Recovery readiness <HelpTooltip {...helpText.recoveryReadiness} />
          </h1>
        </div>
        <Button loading={recalculating} onClick={recalculate}>
          Recalculate recovery
        </Button>
        <TutorialLauncher pageKey="recovery" steps={getTutorialSteps("recovery")} />
      </div>

      {loading ? <p className="text-forge-steel">Loading recovery scores...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {user?.beginnerTipsEnabled !== false ? (
        <div className="mb-6">
          <BeginnerTip title="Indirect recovery matters">
            If you train chest, your front shoulders and triceps may still need recovery because they helped during
            pressing exercises. Recovery shows what is ready; ForgeLift also checks training balance before choosing
            what you should train next.
          </BeginnerTip>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>Direct <HelpTooltip {...helpText.directLoad} size="xs" /></span>
        <span>Indirect <HelpTooltip {...helpText.indirectLoad} size="xs" /></span>
        <span>Stabiliser <HelpTooltip {...helpText.stabiliserLoad} size="xs" /></span>
        <span>Rest recommendation <HelpTooltip title="Rest Recommendation" content="How long ForgeLift suggests waiting before heavy work for that muscle." example="A poor recovery score may suggest 36 to 72 hours." size="xs" /></span>
      </div>
      <button
        className="mb-6 text-sm font-semibold text-forge-ember hover:text-orange-300"
        type="button"
        onClick={() => setShowDetailedMuscles(!showDetailedMuscles)}
      >
        {showDetailedMuscles ? "Show broad muscle groups" : "Show detailed muscles"}
      </button>

      {!loading && !error && !hasRecoveryData ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <p className="text-lg font-bold text-white">No recovery data yet.</p>
          <p className="mt-2 text-slate-400">Log your first workout to start tracking muscle recovery.</p>
        </div>
      ) : null}

      <div data-tour-id="recovery-summary">
        {todayRecommendation ? <TodayRecommendationCard recommendation={todayRecommendation} /> : null}
      </div>

      <VisualSummaryGrid className="mt-6">
        <IconMetricCard icon={Dumbbell} label="Best today" value={todayRecommendation?.bestWorkoutType || "Any Workout"} status="Recommended workout type" variant="info" />
        <IconMetricCard icon={HeartPulse} label="Ready muscles" value={readyMuscles.length} status={readyMuscles.slice(0, 3).join(", ") || "None yet"} variant="success" />
        <IconMetricCard icon={AlertTriangle} label="Avoid heavy" value={avoidMuscles.length} status={avoidMuscles.slice(0, 3).join(", ") || "No avoid warnings"} variant={avoidMuscles.length ? "warning" : "success"} />
        <IconMetricCard icon={Activity} label="Tracked muscles" value={recoveryScores.length} status="Recovery cards below" variant="neutral" />
      </VisualSummaryGrid>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div data-tour-id="recovery-ready-groups">
          <MuscleAvoidList title="Ready to train" muscles={readyMuscles.slice(0, 8)} tone="ready" />
        </div>
        <div data-tour-id="recovery-avoid-groups">
          <MuscleAvoidList title="Avoid heavy work" muscles={avoidMuscles.slice(0, 8)} />
        </div>
      </div>

      <section data-tour-id="recovery-card" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleScoresWithData.map((recovery) => (
          <RecoveryCard key={recovery.muscleGroup} recovery={recovery} />
        ))}
      </section>
      {visibleNoDataScores.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black text-white">No data yet</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleNoDataScores.map((recovery) => (
              <RecoveryCard key={recovery.muscleGroup} recovery={recovery} />
            ))}
          </div>
        </section>
      ) : null}
    </Layout>
  );
};

export default RecoveryPage;
