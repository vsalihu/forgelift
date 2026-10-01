import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import RefreshButton from "../components/advice/RefreshButton.jsx";
import OverloadCard from "../components/overload/OverloadCard.jsx";
import { FILTERS, overloadType } from "../components/overload/overloadTypes.js";
import { DeloadIcon, OverloadIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { deloadService } from "../services/deloadService.js";
import { overloadService } from "../services/overloadService.js";

const chip = (selected) =>
  `min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
    selected ? "border-forge-ember/50 bg-forge-ember/15 text-white" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
  }`;

const SmartOverloadPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [baselineRecommendations, setBaselineRecommendations] = useState([]);
  const [deloadRecommendations, setDeloadRecommendations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [muscle, setMuscle] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    const [data, deloadData] = await Promise.all([overloadService.getOverloadRecommendations(), deloadService.getDeloadRecommendations()]);
    setRecommendations(data.recommendations || []);
    setBaselineRecommendations(data.baselineRecommendations || []);
    setDeloadRecommendations(deloadData.recommendations || []);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      await overloadService.recalculateOverloadRecommendations();
      await fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await overloadService.updateOverloadStatus(id, status);
      setRecommendations((current) => current.filter((recommendation) => recommendation._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const groupCounts = useMemo(() => {
    const counts = {};
    recommendations.forEach((item) => {
      const group = overloadType(item.recommendationType).group;
      counts[group] = (counts[group] || 0) + 1;
    });
    return counts;
  }, [recommendations]);

  const muscles = useMemo(() => [...new Set(recommendations.flatMap((item) => item.muscleGroups || []))].sort(), [recommendations]);

  const filtered = recommendations.filter(
    (item) => (filter === "all" || overloadType(item.recommendationType).group === filter) && (!muscle || item.muscleGroups?.includes(muscle))
  );

  const deloadFor = (item) =>
    deloadRecommendations.find(
      (deload) => deload.exerciseName === item.exerciseName || (deload.muscleGroup && item.muscleGroups?.includes(deload.muscleGroup)) || deload.scope === "full_body"
    );

  const up = groupCounts.up || 0;
  const back = (groupCounts.back || 0) + (groupCounts.warn || 0);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          actions={<RefreshButton busy={recalculating} onClick={handleRecalculate} />}
          description="Your next target for each lift, from your last sessions, effort, recovery and goal. Up isn't the only answer."
          eyebrow="Smart Overload"
          title="Your next targets"
          tutorialPageKey="smart_overload"
        />

        {error ? <ErrorState message={error} onRetry={loadRecommendations} /> : null}
        {loading ? <LoadingBlocks hero="h-40" label="Loading targets" /> : null}

        {!loading && !error && !recommendations.length && !baselineRecommendations.length ? (
          <EmptyPanel icon={OverloadIcon} title="No targets yet.">
            Log a workout and every lift in it gets a target for next time.
          </EmptyPanel>
        ) : null}

        {!loading && recommendations.length ? (
          <AdviceHero glow="bg-emerald-400/15">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">Next session</p>
                <h2 className="font-display mt-1 text-3xl leading-tight text-white sm:text-4xl">
                  {up ? `${up} ${up === 1 ? "lift is" : "lifts are"} ready to go up.` : "Hold steady this time."}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {groupCounts.repeat ? `${groupCounts.repeat} to repeat` : ""}
                  {groupCounts.repeat && back ? " · " : ""}
                  {back ? `${back} to ease off or watch` : ""}
                </p>
              </div>
              <Link
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_34px_-12px_rgba(249,115,22,0.9)]"
                to="/gym-mode"
              >
                Train now
              </Link>
            </div>
            {deloadRecommendations.length ? (
              <p className="mt-5 flex gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/[0.08] p-3 text-sm text-red-100">
                <DeloadIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {deloadRecommendations.length} deload {deloadRecommendations.length === 1 ? "plan is" : "plans are"} active. Targets it covers are marked below.{" "}
                  <Link className="font-bold underline underline-offset-2" to="/deload">
                    Open deloads
                  </Link>
                </span>
              </p>
            ) : null}
          </AdviceHero>
        ) : null}

        {!loading && recommendations.length ? (
          <section aria-label="Targets" className="mt-8">
            <div aria-label="Filter by action" className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="group">
              {FILTERS.map((item) => {
                const count = item.key === "all" ? recommendations.length : groupCounts[item.key] || 0;
                if (item.key !== "all" && !count) return null;
                return (
                  <button aria-pressed={filter === item.key} className={chip(filter === item.key)} key={item.key} type="button" onClick={() => setFilter(item.key)}>
                    {item.label} <span className="tabular-nums text-zinc-500">{count}</span>
                  </button>
                );
              })}
            </div>
            {muscles.length > 1 ? (
              <div aria-label="Filter by muscle" className="scrollbar-none -mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="group">
                <button aria-pressed={!muscle} className={chip(!muscle)} type="button" onClick={() => setMuscle("")}>
                  Any muscle
                </button>
                {muscles.map((name) => (
                  <button aria-pressed={muscle === name} className={chip(muscle === name)} key={name} type="button" onClick={() => setMuscle(muscle === name ? "" : name)}>
                    {name}
                  </button>
                ))}
              </div>
            ) : null}

            {!filtered.length ? <p className="py-10 text-center text-zinc-400">No targets match these filters.</p> : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-2" data-tour-id="overload-recommendations">
              {filtered.map((recommendation, index) => (
                <div data-tour-id={index === 0 ? "overload-card" : undefined} key={recommendation._id}>
                  <OverloadCard activeDeload={deloadFor(recommendation)} index={index} recommendation={recommendation} onStatusChange={handleStatusChange} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && baselineRecommendations.length ? (
          <section aria-labelledby="baseline-heading" className="mt-10">
            <h2 className="font-display text-2xl text-white" id="baseline-heading">
              Starting points
            </h2>
            <p className="mt-1 text-sm text-zinc-500">For lifts you haven't logged yet, estimated from your strength baselines. Adjust after the first session.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {baselineRecommendations.slice(0, 10).map((item) => (
                <li className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4" key={item.exerciseName}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-bold text-white">{item.exerciseName}</p>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-orange-200">
                      {item.recommendedWeight}kg × {item.recommendedRepTarget}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.confidence} confidence{item.reason ? ` · ${item.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loading && (recommendations.length || baselineRecommendations.length) ? (
          <Explainer
            className="mt-8"
            items={[
              ["Add weight or reps", "You hit the top of your rep range with effort to spare. Time to progress."],
              ["Repeat", "Close, but not there yet. Same weight, aim for cleaner or more reps."],
              ["Back off", "Effort was too high or reps dropped. A small step down keeps you progressing."],
              ["Confidence", "How much history the target is based on. More sessions, more confidence."]
            ]}
          />
        ) : null}
      </div>
    </Layout>
  );
};

export default SmartOverloadPage;
