import { useEffect, useState } from "react";
import { Calculator, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Layout from "../components/Layout.jsx";
import StrengthExerciseSelector from "../components/strength/StrengthExerciseSelector.jsx";
import BeginnerTip from "../components/ui/BeginnerTip.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";
import { helpText } from "../utils/helpText.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const estimatedOneRepMax = (weight, reps) => {
  const numericWeight = Number(weight) || 0;
  const numericReps = Number(reps) || 0;
  if (numericWeight <= 0 || numericReps <= 0) return 0;
  if (numericReps === 1) return numericWeight;
  return Math.round(numericWeight * (1 + numericReps / 30) * 10) / 10;
};

const SourceBadge = ({ source }) => {
  const label = source === "user_entered" ? "User Entered" : source === "workout_history" ? "Workout History" : "Estimated";
  const className =
    source === "user_entered"
      ? "bg-emerald-500/15 text-emerald-200"
      : source === "workout_history"
        ? "bg-sky-500/15 text-sky-200"
        : "bg-white/10 text-slate-200";
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${className}`}>{label}</span>;
};

const ConfidenceBadge = ({ confidence }) => {
  const className =
    confidence === "High"
      ? "bg-emerald-500/15 text-emerald-200"
      : confidence === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-red-500/15 text-red-200";
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${className}`}>{confidence} Confidence</span>;
};

const BaselineCard = ({ baseline, onDelete }) => (
  <article className="rounded-lg border border-white/10 bg-black/20 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-black text-white">{baseline.exerciseName}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <SourceBadge source={baseline.source} />
          <ConfidenceBadge confidence={baseline.confidence} />
        </div>
      </div>
      <button
        className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-red-200"
        type="button"
        onClick={() => onDelete(baseline._id)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-slate-500">Estimated 1RM <HelpTooltip {...helpText.estimated1RM} size="xs" /></dt>
        <dd className="mt-1 font-bold text-white">{formatNumber(baseline.estimatedOneRepMax)}kg</dd>
      </div>
      <div>
        <dt className="text-slate-500">Suggested weight <HelpTooltip title="Suggested Working Weight" content="A conservative starting weight for normal working sets." example="If the estimate says 75kg, use it as a starting point and adjust by feel." size="xs" /></dt>
        <dd className="mt-1 font-bold text-white">{formatNumber(baseline.suggestedWorkingWeight || baseline.workingWeight)}kg</dd>
      </div>
      <div>
        <dt className="text-slate-500">Rep range</dt>
        <dd className="mt-1 font-bold text-white">{baseline.suggestedRepRange || `${baseline.reps} reps`}</dd>
      </div>
    </dl>
    {baseline.sourceExerciseName ? (
      <p className="mt-3 text-sm text-slate-400">Based on: {baseline.sourceExerciseName}</p>
    ) : null}
    {baseline.note ? <p className="mt-2 text-sm text-slate-500">{baseline.note}</p> : null}
  </article>
);

const StrengthBaselinesPage = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [form, setForm] = useState({ exerciseName: "Bench Press", weight: "", reps: "1" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [exerciseData, baselineData] = await Promise.all([
        exerciseService.getExercises(),
        strengthBaselineService.getStrengthBaselines()
      ]);
      setExercises(exerciseData.exercises || []);
      setBaselines(baselineData.baselines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userEnteredBaselines = baselines.filter((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
  const estimatedBaselines = baselines.filter((baseline) => baseline.source === "estimated_from_baseline");
  const oneRepMaxPreview = estimatedOneRepMax(form.weight, form.reps);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const data = await strengthBaselineService.saveStrengthBaseline(form);
      setBaselines(data.baselines || []);
      setMessage("Strength baseline saved and related estimates updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await strengthBaselineService.deleteStrengthBaseline(id);
      setBaselines(data.baselines || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecalculate = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await strengthBaselineService.recalculateStrengthBaselines();
      setBaselines(data.baselines || []);
      setMessage("Strength estimates recalculated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Strength Baselines</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Strength Baseline Estimator <HelpTooltip {...helpText.strengthBaseline} />
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Enter known strength numbers for main lifts. ForgeLift estimates conservative starting points for
            related exercises.
          </p>
        </div>
        <Button loading={saving} type="button" variant="secondary" onClick={handleRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate estimates
        </Button>
      </div>

      <div className="mb-6 rounded-lg border border-forge-copper/30 bg-forge-copper/10 p-4 text-sm text-orange-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            These are estimated starting points based on your entered strength baseline. Adjust them based on your
            real performance. Want ForgeLift to estimate your starting numbers automatically? Complete the ForgeLift
            Assessment.
          </p>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            to="/assessment"
          >
            Start Assessment
          </Link>
        </div>
      </div>
      {user?.assessmentCompleted ? (
        <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Baselines from your latest assessment are included below when they match your entered lifts.
        </div>
      ) : null}
      {user?.beginnerTipsEnabled !== false ? (
        <div className="mb-6">
          <BeginnerTip title="Strength baseline reminder">
            Estimated related lifts are starting points only. Real workout history always beats estimates, and these
            estimates do not strongly inflate your ranks.
          </BeginnerTip>
        </div>
      ) : null}

      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
      {message ? <div className="mb-5 rounded-md bg-green-500/10 p-3 text-sm text-green-200">{message}</div> : null}

      <section className="metal-panel mb-6 rounded-lg p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-md bg-forge-ember/15 p-2 text-forge-ember">
            <Calculator className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-bold text-white">Add or update baseline</h2>
        </div>
        <form className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]" onSubmit={handleSubmit}>
          <StrengthExerciseSelector
            exercises={exercises}
            selectedName={form.exerciseName}
            onSelect={(exerciseName) => setForm({ ...form, exerciseName })}
          />
          <div className="space-y-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-sm font-bold text-slate-300">Selected exercise</p>
              <p className="mt-1 text-xl font-black text-white">{form.exerciseName || "Choose an exercise"}</p>
            </div>
            <FormInput
              label="Weight lifted"
              min="0"
              type="number"
              value={form.weight}
              onChange={(event) => setForm({ ...form, weight: event.target.value })}
              required
            />
            <FormInput
              label="Reps"
              max="30"
              min="1"
              type="number"
              value={form.reps}
              onChange={(event) => setForm({ ...form, reps: event.target.value })}
              required
            />
            <p className="text-sm text-slate-400">
              Estimated 1RM preview <HelpTooltip {...helpText.estimated1RM} size="xs" />: {formatNumber(oneRepMaxPreview)}kg
            </p>
            <Button className="w-full" disabled={!form.exerciseName} loading={saving} type="submit">
              Save baseline
            </Button>
          </div>
        </form>
      </section>

      {loading ? <p className="text-forge-steel">Loading strength baselines...</p> : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">User-entered baselines</h2>
            <div className="space-y-4">
              {userEnteredBaselines.length ? (
                userEnteredBaselines.map((baseline) => <BaselineCard baseline={baseline} key={baseline._id} onDelete={handleDelete} />)
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-slate-400">
                  Add Bench Press, Squat, Deadlift, or another main lift to generate estimates.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">Estimated related exercises</h2>
            <div className="space-y-4">
              {estimatedBaselines.length ? (
                estimatedBaselines.map((baseline) => <BaselineCard baseline={baseline} key={baseline._id} onDelete={handleDelete} />)
              ) : (
                <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-slate-400">
                  Related exercise estimates will appear after you save a baseline.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default StrengthBaselinesPage;
