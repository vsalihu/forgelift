import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import OverloadRecommendationCard from "../components/overload/OverloadRecommendationCard.jsx";
import SelectInput from "../components/SelectInput.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { deloadService } from "../services/deloadService.js";
import { overloadService } from "../services/overloadService.js";
import { helpText } from "../utils/helpText.js";

const typeOptions = [
  { value: "", label: "All types" },
  { value: "increase_weight", label: "Increase Weight" },
  { value: "repeat_weight", label: "Repeat Weight" },
  { value: "increase_reps", label: "Increase Reps" },
  { value: "reduce_weight", label: "Reduce Weight" },
  { value: "recovery_warning", label: "Recovery Warning" },
  { value: "plateau_warning", label: "Plateau Warning" },
  { value: "deload_flag", label: "Deload Flag" }
];

const SmartOverloadPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [baselineRecommendations, setBaselineRecommendations] = useState([]);
  const [deloadRecommendations, setDeloadRecommendations] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadRecommendations = async () => {
    setLoading(true);
    setError("");

    try {
      const [data, deloadData] = await Promise.all([
        overloadService.getOverloadRecommendations(),
        deloadService.getDeloadRecommendations()
      ]);
      setRecommendations(data.recommendations || []);
      setBaselineRecommendations(data.baselineRecommendations || []);
      setDeloadRecommendations(deloadData.recommendations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const muscleOptions = useMemo(() => {
    const muscles = recommendations.flatMap((recommendation) => recommendation.muscleGroups || []);
    return [
      { value: "", label: "All muscles" },
      ...[...new Set(muscles)].sort().map((muscle) => ({ value: muscle, label: muscle }))
    ];
  }, [recommendations]);

  const filteredRecommendations = recommendations.filter((recommendation) => {
    const matchesType = !typeFilter || recommendation.recommendationType === typeFilter;
    const matchesMuscle = !muscleFilter || recommendation.muscleGroups?.includes(muscleFilter);
    return matchesType && matchesMuscle;
  });

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError("");

    try {
      await overloadService.recalculateOverloadRecommendations();
      const data = await overloadService.getOverloadRecommendations();
      setRecommendations(data.recommendations || []);
      setBaselineRecommendations(data.baselineRecommendations || []);
      const deloadData = await deloadService.getDeloadRecommendations();
      setDeloadRecommendations(deloadData.recommendations || []);
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

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Smart Overload</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Next-session recommendations <HelpTooltip {...helpText.smartOverload} />
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            ForgeLift uses your last sessions, RPE, recovery, weak points, and goal path to decide whether to add
            weight, add reps, repeat, reduce load, or hold back.
          </p>
        </div>
        <Button loading={recalculating} type="button" onClick={handleRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>

      {user?.beginnerTipsEnabled !== false ? (
        <div className="mb-6">
          <BeginnerTip title="Overload does not always mean add weight">
            ForgeLift may recommend increasing weight, repeating the same weight, adding reps, reducing weight, or
            waiting because recovery is low.
          </BeginnerTip>
        </div>
      ) : null}

      <section className="metal-panel mb-6 rounded-lg p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectInput
            label={
              <span className="inline-flex items-center gap-1">
                Recommendation type <HelpTooltip title="Recommendation Type" content="The action ForgeLift suggests for your next session." example="Increase weight, repeat weight, reduce weight, recovery warning, plateau warning, or deload flag." />
              </span>
            }
            options={typeOptions}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          />
          <SelectInput
            label="Muscle group"
            options={muscleOptions}
            value={muscleFilter}
            onChange={(event) => setMuscleFilter(event.target.value)}
          />
        </div>
      </section>

      {loading ? <p className="text-forge-steel">Loading overload recommendations...</p> : null}
      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error && recommendations.length === 0 ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-forge-copper" />
          <h2 className="mt-4 text-xl font-bold text-white">No overload recommendations yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Log workouts to generate next-session targets for each exercise.
          </p>
        </div>
      ) : null}

      {!loading && baselineRecommendations.length ? (
        <section className="metal-panel mb-6 rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            Strength baseline starting points <HelpTooltip {...helpText.strengthBaseline} />
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            These are conservative estimates for exercises without real workout history. Adjust after your first real session.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {baselineRecommendations.slice(0, 8).map((recommendation) => (
              <div className="rounded-md border border-white/10 bg-black/20 p-4 text-sm" key={recommendation.exerciseName}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-white">{recommendation.exerciseName}</p>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                    {recommendation.confidence} confidence
                  </span>
                </div>
                <p className="mt-2 text-slate-300">
                  Start around {recommendation.recommendedWeight}kg for {recommendation.recommendedRepTarget}.
                </p>
                <p className="mt-2 text-slate-500">{recommendation.reason}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && recommendations.length > 0 && filteredRecommendations.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/15 p-6 text-center text-slate-400">
          No active recommendations match these filters.
        </div>
      ) : null}

      <div className="space-y-5">
        {filteredRecommendations.map((recommendation) => {
          const activeDeload = deloadRecommendations.find(
            (deload) =>
              deload.exerciseName === recommendation.exerciseName ||
              (deload.muscleGroup && recommendation.muscleGroups?.includes(deload.muscleGroup)) ||
              deload.scope === "full_body"
          );

          return (
            <OverloadRecommendationCard
              activeDeload={activeDeload}
              key={recommendation._id}
              recommendation={recommendation}
              onStatusChange={handleStatusChange}
            />
          );
        })}
      </div>
    </Layout>
  );
};

export default SmartOverloadPage;
