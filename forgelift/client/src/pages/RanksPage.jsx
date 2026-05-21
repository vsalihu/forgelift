import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import MuscleRankCard from "../components/ranks/MuscleRankCard.jsx";
import RankProgressCard from "../components/ranks/RankProgressCard.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import { rankService } from "../services/rankService.js";
import { helpText } from "../utils/helpText.js";

const RanksPage = () => {
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadRanks = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await rankService.getRanks();
      setRankData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanks();
  }, []);

  const recalculateRanks = async () => {
    setRecalculating(true);
    setError("");

    try {
      const data = await rankService.recalculateRanks();
      setRankData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const hasTrainingData = rankData?.muscleRanks?.some((rank) => rank.workoutCount > 0);

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Ranks</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            ForgeLift ranking <HelpTooltip {...helpText.rank} />
          </h1>
        </div>
        <Button loading={recalculating} onClick={recalculateRanks}>
          Recalculate ranks
        </Button>
      </div>

      {loading ? <p className="text-forge-steel">Loading ranks...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>XP <HelpTooltip {...helpText.xp} size="xs" /></span>
        <span>Rank score <HelpTooltip title="Rank Score" content="A points score based mostly on real workout history, strength, volume, consistency, and PRs." example="Strength baselines do not strongly inflate rank." size="xs" /></span>
        <span>Progress to next rank <HelpTooltip title="Progress to Next Rank" content="How close your current score is to the next rank." example="64% to Gold means you are over halfway through Silver." size="xs" /></span>
      </div>

      {rankData ? (
        <>
          <RankProgressCard
            overallRank={rankData.overallRank}
            overallScore={rankData.overallScore}
            overallProgress={rankData.overallProgress}
            xp={rankData.xp}
          />

          {!hasTrainingData ? (
            <div className="metal-panel mt-6 rounded-lg p-8 text-center">
              <Shield className="mx-auto mb-3 h-9 w-9 text-forge-copper" />
              <p className="text-lg font-bold text-white">No muscle ranks yet.</p>
              <p className="mt-2 text-slate-400">Log completed workouts, then recalculate ranks to build your ranking profile.</p>
            </div>
          ) : null}

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rankData.muscleRanks.map((muscleRank) => (
              <MuscleRankCard key={muscleRank.muscleGroup} muscleRank={muscleRank} />
            ))}
          </section>
        </>
      ) : null}
    </Layout>
  );
};

export default RanksPage;
