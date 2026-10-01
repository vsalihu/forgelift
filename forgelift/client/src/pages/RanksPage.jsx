import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import MuscleRankTile from "../components/ranks/MuscleRankTile.jsx";
import RankHero from "../components/ranks/RankHero.jsx";
import { GymModeIcon, RanksIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { rankService } from "../services/rankService.js";
import { getBroadMuscleImage } from "../utils/muscleImages.js";

const FACTORS = [
  ["Strength", "Your best estimated 1RMs for the muscle."],
  ["Volume", "How much work it has done over time."],
  ["Consistency", "How regularly you train it."],
  ["Records", "New PRs on its lifts."]
];

const RanksPage = () => {
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRanks = async () => {
    setLoading(true);
    setError("");
    try {
      setRankData(await rankService.getRanks());
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
    setNotice("");
    try {
      const data = await rankService.recalculateRanks();
      setRankData(data);
      setNotice(data.rankPromotions?.length ? data.rankPromotions.map((promotion) => promotion.message).join(". ") : "Ranks are up to date.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const { ranked, unranked } = useMemo(() => {
    const all = rankData?.muscleRanks || [];
    return {
      ranked: all.filter((rank) => rank.dataAvailable !== false && rank.workoutCount > 0).sort((a, b) => (b.score || 0) - (a.score || 0)),
      unranked: all.filter((rank) => !(rank.dataAvailable !== false && rank.workoutCount > 0))
    };
  }, [rankData]);

  const tagFor = (index) => {
    if (ranked.length < 2) return null;
    if (index === 0) return { label: "Strongest", tone: "ember" };
    if (index === ranked.length - 1) return { label: "Most room to grow" };
    return null;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-60"
              disabled={recalculating}
              type="button"
              onClick={recalculateRanks}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating…" : "Recalculate"}
            </button>
          }
          description="Every muscle earns its own rank from real training. Your overall rank blends them."
          eyebrow="Ranks"
          title="Your rank"
          tutorialPageKey="ranks"
        />

        {error ? <ErrorState message={error} onRetry={loadRanks} /> : null}
        <p aria-live="polite" className={notice ? "mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200" : "sr-only"}>
          {notice}
        </p>

        {loading ? (
          <div aria-busy="true" aria-label="Loading ranks" className="space-y-4">
            <div className="h-80 animate-pulse rounded-[2rem] bg-white/[0.04]" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div className="h-52 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
              ))}
            </div>
          </div>
        ) : null}

        {rankData ? (
          <>
            <RankHero overallProgress={rankData.overallProgress} overallRank={rankData.overallRank} overallScore={rankData.overallScore} xp={rankData.xp} />

            <section aria-labelledby="scoring-heading" className="mt-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-zinc-200" id="scoring-heading">
                How a muscle is scored
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
                {FACTORS.map(([label, text]) => (
                  <li className="min-w-0" key={label}>
                    <p className="text-sm font-bold text-orange-200">{label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-zinc-500">{text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="muscle-ranks-heading" className="mt-10">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl text-white" id="muscle-ranks-heading">
                  Muscle ranks
                </h2>
                {ranked.length ? <span className="text-sm text-zinc-500">Strongest first</span> : null}
              </div>

              {ranked.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ranked.map((muscleRank, index) => (
                    <MuscleRankTile index={index} key={muscleRank.muscleGroup} muscleRank={muscleRank} tag={tagFor(index)} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-10 text-center">
                  <RanksIcon className="mx-auto h-10 w-10 text-orange-300" />
                  <h3 className="font-display mt-4 text-2xl text-white">No muscle ranks yet.</h3>
                  <p className="mx-auto mt-2 max-w-sm text-zinc-400">Finish a workout and each muscle it trains gets ranked from what you actually lifted.</p>
                  <Link className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02]" to="/gym-mode">
                    <GymModeIcon className="h-4 w-4" />
                    Start Gym Mode
                  </Link>
                </div>
              )}

              {unranked.length ? (
                <div className="mt-6 rounded-3xl border border-dashed border-white/12 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-zinc-200">Not ranked yet</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">Log direct work for these and they get a rank of their own.</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {unranked.map((muscleRank) => {
                      const image = getBroadMuscleImage(muscleRank.muscleGroup);
                      return (
                        <li className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-sm text-zinc-300" key={muscleRank.muscleGroup}>
                          {image ? <img alt="" className="h-7 w-7 rounded-full bg-black/30 object-contain p-0.5 opacity-70" height="28" src={image} width="28" /> : null}
                          {muscleRank.muscleGroup}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default RanksPage;
