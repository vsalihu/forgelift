import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import RefreshButton from "../components/advice/RefreshButton.jsx";
import { tone as getTone } from "../components/advice/tones.js";
import RatioGauge from "../components/trainingBalance/RatioGauge.jsx";
import { BalanceIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { trainingBalanceService } from "../services/trainingBalanceService.js";

const scoreTone = (score) => (score >= 85 ? "good" : score >= 70 ? "caution" : score >= 50 ? "serious" : "critical");

const ScoreRing = ({ score }) => {
  const reduce = useReducedMotion();
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const t = getTone(scoreTone(score));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div aria-hidden="true" className={`absolute inset-6 rounded-full blur-2xl ${t.glow}`} />
      <svg aria-hidden="true" className="relative -rotate-90" height={size} width={size}>
        <circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          initial={reduce ? false : { strokeDashoffset: circumference }}
          r={radius}
          stroke={t.hex}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={stroke}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl leading-none tabular-nums text-white">{score}</span>
        <span className="mt-1 text-xs text-zinc-500">out of 100</span>
      </div>
    </div>
  );
};

const ListPanel = ({ title, items, tone }) => (
  <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
    <h2 className="text-base font-bold text-white">{title}</h2>
    {items.length ? (
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li className="flex gap-2.5 text-sm leading-6 text-zinc-300" key={item}>
            <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "good" ? "bg-emerald-400" : "bg-amber-300"}`} />
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm text-zinc-500">Nothing here right now.</p>
    )}
  </section>
);

const TrainingBalancePage = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadTrainingBalance = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await trainingBalanceService.getTrainingBalance();
      setBalance(data.trainingBalance || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingBalance();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      const data = await trainingBalanceService.recalculateTrainingBalance();
      setBalance(data.trainingBalance || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const hasScore = balance && balance.score !== null && balance.score !== undefined && balance.minimumDataMet !== false;
  const directShare = balance?.directIndirectRatio ? Math.round((balance.directIndirectRatio / (1 + balance.directIndirectRatio)) * 100) : null;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={<RefreshButton busy={recalculating} onClick={recalculate} />}
          description="Whether your training covers the body evenly: push and pull, upper and lower, front and back."
          eyebrow="Balance"
          title="How even is your training?"
          tutorialPageKey="training_balance"
        />

        {error ? <ErrorState message={error} onRetry={loadTrainingBalance} /> : null}
        {loading ? <LoadingBlocks hero="h-56" label="Loading balance" /> : null}

        {!loading && !error && balance && !hasScore ? (
          <EmptyPanel icon={BalanceIcon} title="Not enough training yet.">
            Log at least 3 workouts that train 2 or more muscle groups and ForgeLift scores your balance.
          </EmptyPanel>
        ) : null}

        {!loading && hasScore ? (
          <>
            <AdviceHero glow={`${getTone(scoreTone(balance.score)).glow}`} tourId="training-balance-overview">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <ScoreRing score={Math.round(balance.score)} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${getTone(scoreTone(balance.score)).text}`}>{balance.status || "Balance score"}</p>
                  <h2 className="font-display mt-1 text-3xl leading-tight text-white sm:text-4xl">
                    {balance.score >= 85 ? "Well balanced." : balance.score >= 70 ? "Mostly even, a few gaps." : "Lopsided. Worth fixing."}
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {balance.strongestAreas?.length ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Strongest</p>
                        <ul className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                          {balance.strongestAreas.map((area) => (
                            <li className="rounded-full bg-emerald-500/[0.12] px-3 py-1 text-sm font-semibold text-emerald-100" key={area}>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {balance.weakestAreas?.length ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Weakest</p>
                        <ul className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                          {balance.weakestAreas.map((area) => (
                            <li className="rounded-full bg-amber-400/[0.12] px-3 py-1 text-sm font-semibold text-amber-100" key={area}>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </AdviceHero>

            <section aria-labelledby="ratios-heading" className="mt-10">
              <h2 className="font-display text-2xl text-white" id="ratios-heading">
                The ratios
              </h2>
              <p className="mb-4 mt-1 text-sm text-zinc-500">The green band is balanced (0.8x to 1.25x).</p>
              <div className="grid gap-3 md:grid-cols-3">
                <RatioGauge left="pull" note="Chest, shoulders, triceps against back and biceps." ratio={balance.pushPullRatio} right="push" title="Push vs pull" />
                <RatioGauge left="lower" note="Upper body against legs and hips." ratio={balance.upperLowerRatio} right="upper" title="Upper vs lower" />
                <RatioGauge left="rear" note="Chest and quads against back, hamstrings and glutes." ratio={balance.frontRearRatio} right="front" title="Front vs rear" />
              </div>
              {directShare !== null ? (
                <p className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
                  <span className="font-bold tabular-nums text-white">{directShare}%</span> of your work is direct, aimed at the muscle itself. The rest is helper work from other lifts.
                </p>
              ) : null}
            </section>

            <div className="mt-10 grid gap-3 lg:grid-cols-2">
              <ListPanel items={balance.warnings || []} title="Watch out for" tone="caution" />
              <ListPanel items={balance.recommendations || []} title="Do this" tone="good" />
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default TrainingBalancePage;
