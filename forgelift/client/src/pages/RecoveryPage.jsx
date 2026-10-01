import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import RefreshButton from "../components/advice/RefreshButton.jsx";
import ScopeToggle from "../components/advice/ScopeToggle.jsx";
import RecoveryTile from "../components/recovery/RecoveryTile.jsx";
import { GymModeIcon, RecoveryIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { recoveryService } from "../services/recoveryService.js";

const BROAD = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Cardio", "Full Body"];

const GROUPS = [
  { key: "ready", title: "Ready", hint: "80% or more. Train these hard.", test: (score) => score >= 80, tourId: "recovery-ready-groups" },
  { key: "almost", title: "Nearly there", hint: "60 to 79%. Moderate work is fine.", test: (score) => score >= 60 && score < 80 },
  { key: "recovering", title: "Still recovering", hint: "Under 60%. Skip heavy work for now.", test: (score) => score < 60, tourId: "recovery-avoid-groups" }
];

const Chips = ({ label, items, tone }) => (
  <div className="min-w-0">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
    {items.length ? (
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
              tone === "good" ? "bg-emerald-500/[0.12] text-emerald-100" : tone === "avoid" ? "bg-red-500/[0.12] text-red-100" : "border border-white/10 text-zinc-300"
            }`}
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-sm text-zinc-500">None right now</p>
    )}
  </div>
);

const RecoveryPage = () => {
  const [recoveryScores, setRecoveryScores] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [detailed, setDetailed] = useState(false);

  const apply = (data) => {
    setRecoveryScores(data.recoveryScores || []);
    setToday(data.todayRecommendation || null);
  };

  const loadRecovery = async () => {
    setLoading(true);
    setError("");
    try {
      apply(await recoveryService.getTodayRecommendation());
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
      apply(await recoveryService.recalculateRecovery());
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const { withData, noData } = useMemo(() => {
    const inScope = detailed ? recoveryScores : recoveryScores.filter((score) => BROAD.includes(score.muscleGroup));
    const hasData = (score) => score.dataAvailable !== false && score.score !== null && score.score !== undefined;
    return {
      withData: inScope.filter(hasData).sort((a, b) => b.score - a.score),
      noData: inScope.filter((score) => !hasData(score))
    };
  }, [recoveryScores, detailed]);

  const hasAnyData = recoveryScores.some((score) => score.dataAvailable !== false && score.score !== null && score.score !== undefined);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={<RefreshButton busy={recalculating} onClick={recalculate} />}
          description="How recovered each muscle is from recent training, counting the work it did as a helper too."
          eyebrow="Recovery"
          title="Ready to train?"
          tutorialPageKey="recovery"
        />

        {error ? <ErrorState message={error} onRetry={loadRecovery} /> : null}
        {loading ? <LoadingBlocks label="Loading recovery" /> : null}

        {!loading && !error && !hasAnyData ? (
          <EmptyPanel icon={RecoveryIcon} title="No recovery data yet.">
            Finish a workout and ForgeLift starts tracking how each muscle recovers from it.
          </EmptyPanel>
        ) : null}

        {!loading && hasAnyData ? (
          <>
            <AdviceHero glow="bg-emerald-400/15" tourId="recovery-summary">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 lg:max-w-md">
                  <p className="text-sm font-semibold text-emerald-300">Best for today</p>
                  <h2 className="font-display mt-1 text-4xl leading-[1.05] text-white sm:text-5xl">{today?.bestWorkoutType || "Any workout"}</h2>
                  {today?.reasons?.length ? (
                    <ul className="mt-4 space-y-1.5 text-sm leading-6 text-zinc-300">
                      {today.reasons.slice(0, 3).map((reason) => (
                        <li className="flex gap-2" key={reason}>
                          <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link
                    className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_34px_-12px_rgba(249,115,22,0.9)]"
                    to="/gym-mode"
                  >
                    <GymModeIcon className="h-4 w-4" />
                    Start Gym Mode
                  </Link>
                </div>
                <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:w-[26rem] lg:grid-cols-1">
                  <Chips items={today?.bestMusclesToTrain || []} label="Train" tone="good" />
                  <Chips items={today?.musclesToAvoid || []} label="Hold off" tone="avoid" />
                  {today?.missingGroups?.length ? <Chips items={today.missingGroups} label="Not trained this week" /> : null}
                  {today?.undertrainedGroups?.length ? <Chips items={today.undertrainedGroups} label="Undertrained" /> : null}
                </div>
              </div>
            </AdviceHero>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-white">Muscles</h2>
              <ScopeToggle detailed={detailed} onChange={setDetailed} />
            </div>

            {GROUPS.map((group) => {
              const items = withData.filter((score) => group.test(score.score));
              if (!items.length) return null;
              return (
                <section aria-labelledby={`recovery-${group.key}`} className="mt-6" data-tour-id={group.tourId} key={group.key}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-base font-bold text-white" id={`recovery-${group.key}`}>
                      {group.title} <span className="font-normal tabular-nums text-zinc-500">{items.length}</span>
                    </h3>
                    <p className="text-sm text-zinc-500">{group.hint}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((recovery) => (
                      <RecoveryTile key={recovery.muscleGroup} recovery={recovery} />
                    ))}
                  </div>
                </section>
              );
            })}

            {noData.length ? (
              <div className="mt-6 rounded-3xl border border-dashed border-white/12 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-zinc-200">No data yet</h3>
                <p className="mt-0.5 text-sm text-zinc-500">These haven't been trained recently enough to estimate.</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {noData.map((score) => (
                    <li className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-400" key={score.muscleGroup}>
                      {score.muscleGroup}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Explainer
              className="mt-8"
              items={[
                ["Direct load", "Work aimed straight at the muscle, like chest on bench press."],
                ["Indirect load", "Work it did helping another muscle, like triceps on bench press. It still needs recovery."],
                ["Stabiliser load", "Work holding you steady, like your core during squats."],
                ["Heavy work from", "The earliest time ForgeLift suggests training this muscle hard again."]
              ]}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default RecoveryPage;
