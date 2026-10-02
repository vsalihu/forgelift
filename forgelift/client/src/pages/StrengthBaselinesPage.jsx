import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import LiftPicker from "../components/strength/LiftPicker.jsx";
import { CONFIDENCE_TONES, SOURCE_LABELS, estimateOneRepMax, formatWeight } from "../components/strength/baselineMeta.js";
import { cleanDecimal } from "../components/gym/gymUtils.js";
import { AssessmentIcon, BaselinesIcon } from "../components/icons/navIcons.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { strengthBaselineService } from "../services/strengthBaselineService.js";

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-25";

const Chip = ({ className, children }) => <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{children}</span>;

const YourLiftCard = ({ baseline, unit, estimateCount, index, onUpdate, onDelete }) => {
  const reduce = useReducedMotion();
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug text-white">{baseline.exerciseName}</h3>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <Chip className={baseline.source === "workout_history" ? "bg-sky-400/10 text-sky-200" : "bg-forge-ember/10 text-orange-200"}>{SOURCE_LABELS[baseline.source] || "Entered"}</Chip>
          </p>
        </div>
        <button aria-label={`Delete ${baseline.exerciseName}`} className={`${iconButton} hover:text-red-200`} type="button" onClick={() => onDelete(baseline)}>
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p>
          <span className="font-display text-4xl leading-none tabular-nums text-white">{formatWeight(baseline.estimatedOneRepMax)}</span>
          <span className="ml-1 text-sm font-semibold text-zinc-400">{unit}</span>
          <span className="mt-1 block text-xs text-zinc-500">Estimated 1-rep max</span>
        </p>
        <p className="text-right text-sm text-zinc-300">
          <span className="font-bold tabular-nums text-white">
            {formatWeight(baseline.workingWeight || baseline.suggestedWorkingWeight)} {unit} × {baseline.reps}
          </span>
          <span className="block text-xs text-zinc-500">what you lifted</span>
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <p className="text-xs text-zinc-500">{estimateCount ? `${estimateCount} related lift${estimateCount === 1 ? "" : "s"} estimated from it` : "No related lifts yet"}</p>
        <button className="min-h-10 rounded-full px-3 text-sm font-bold text-orange-300 hover:bg-white/[0.05] hover:text-orange-200" type="button" onClick={() => onUpdate(baseline)}>
          Update
        </button>
      </div>
    </motion.article>
  );
};

const EstimateGroup = ({ title, items, unit, onDelete }) => (
  <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
    <h3 className="text-sm font-semibold text-zinc-400">
      From <span className="text-white">{title}</span>
    </h3>
    <ul className="mt-3 divide-y divide-white/[0.06]">
      {items.map((baseline) => (
        <li className="flex items-center gap-3 py-2.5" key={baseline._id || baseline.exerciseName}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{baseline.exerciseName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              <span>
                Start at <span className="font-bold tabular-nums text-zinc-200">{formatWeight(baseline.suggestedWorkingWeight || baseline.workingWeight)} {unit}</span>
                {baseline.suggestedRepRange ? ` for ${baseline.suggestedRepRange}` : ""}
              </span>
              {baseline.confidence ? <Chip className={CONFIDENCE_TONES[baseline.confidence] || CONFIDENCE_TONES.Low}>{baseline.confidence} confidence</Chip> : null}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-bold tabular-nums text-white">
              {formatWeight(baseline.estimatedOneRepMax)} {unit}
            </span>
            <span className="text-[0.7rem] text-zinc-500">est. 1RM</span>
          </p>
          <button aria-label={`Delete estimate for ${baseline.exerciseName}`} className={`${iconButton} -mr-2 hover:text-red-200`} type="button" onClick={() => onDelete(baseline)}>
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  </section>
);

const StrengthBaselinesPage = () => {
  const { user } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const formRef = useRef(null);
  const [exercises, setExercises] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [form, setForm] = useState({ exerciseName: "Bench Press", weight: "", reps: "5" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [exerciseData, baselineData] = await Promise.all([exerciseService.getExercises(), strengthBaselineService.getStrengthBaselines()]);
      const loaded = baselineData.baselines || [];
      setExercises(exerciseData.exercises || []);
      setBaselines(loaded);
      // Show the saved numbers for the lift that's selected when the page opens.
      setForm((current) => {
        if (current.weight) return current;
        const saved = loaded.find((item) => item.exerciseName === current.exerciseName && item.source !== "estimated_from_baseline");
        return saved ? { ...current, weight: String(saved.workingWeight || ""), reps: String(saved.reps || current.reps) } : current;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const yourLifts = baselines.filter((baseline) => baseline.source === "user_entered" || baseline.source === "workout_history");
  const estimates = baselines.filter((baseline) => baseline.source === "estimated_from_baseline");
  const estimateGroups = useMemo(() => {
    const groups = new Map();
    estimates.forEach((baseline) => {
      const key = baseline.sourceExerciseName || "your other lifts";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(baseline);
    });
    return [...groups.entries()];
  }, [baselines]);
  const existing = yourLifts.find((baseline) => baseline.exerciseName === form.exerciseName);
  const preview = estimateOneRepMax(form.weight, form.reps);
  const reps = Number(form.reps) || 1;

  const selectLift = (exercise) => {
    const known = yourLifts.find((baseline) => baseline.exerciseName === exercise.name);
    setForm({ exerciseName: exercise.name, weight: known ? String(known.workingWeight || "") : "", reps: known ? String(known.reps || 5) : form.reps });
    setFormError("");
    if (window.matchMedia?.("(max-width: 1023px)").matches) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!(Number(form.weight) > 0)) return setFormError("Enter the weight you lifted.");
    if (!(reps >= 1 && reps <= 30)) return setFormError("Reps need to be between 1 and 30.");
    setSaving(true);
    try {
      const data = await strengthBaselineService.saveStrengthBaseline({ exerciseName: form.exerciseName, weight: Number(form.weight), reps });
      setBaselines(data.baselines || []);
      setNotice(`Saved ${form.exerciseName}. Related estimates are updated.`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    setError("");
    try {
      const data = await strengthBaselineService.deleteStrengthBaseline(target._id);
      setBaselines(data.baselines || []);
      setNotice(`Removed ${target.exerciseName}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      const data = await strengthBaselineService.recalculateStrengthBaselines();
      setBaselines(data.baselines || []);
      setNotice("Estimates recalculated from your latest numbers.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <Layout>
      {pendingDelete ? (
        <ConfirmModal
          confirmLabel="Delete"
          description={
            pendingDelete.source === "estimated_from_baseline"
              ? "Recalculating later can bring this estimate back."
              : "Estimates worked out from this lift will be recalculated without it."
          }
          title={`Delete ${pendingDelete.exerciseName}?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      <PageHeader
        actions={
          baselines.length ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50"
              disabled={recalculating}
              type="button"
              onClick={recalculate}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${recalculating ? "animate-spin motion-reduce:animate-none" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
          ) : null
        }
        description="Tell ForgeLift what you can lift on a few main exercises. It works out sensible starting weights for related ones, so your first sessions aren't guesswork."
        eyebrow="Strength baselines"
        title="Your starting numbers"
        tutorialPageKey="strength_baselines"
      />

      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
          <BaselinesIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
          <span>
            Estimates are starting points. Once you log real sets, your workout history takes over.
            {user?.assessmentCompleted ? " Lifts from your assessment are included." : ""}
          </span>
        </p>
        {!user?.assessmentCompleted ? (
          <Link className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white hover:bg-white/[0.09]" to="/assessment">
            <AssessmentIcon aria-hidden="true" className="h-4 w-4 text-orange-300" />
            Let the assessment estimate them
          </Link>
        ) : null}
      </div>

      {notice ? (
        <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm font-semibold text-emerald-200" role="status">
          {notice}
        </p>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadData} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="pick-lift" className="min-w-0">
          <h2 className="font-display mb-3 text-xl text-white" id="pick-lift">
            1. Pick a lift
          </h2>
          {loading ? <div aria-busy="true" className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" /> : (
            <LiftPicker enteredNames={yourLifts.map((baseline) => baseline.exerciseName)} exercises={exercises} selectedName={form.exerciseName} onSelect={selectLift} />
          )}
        </section>

        <form
          className="scroll-mt-24 rounded-3xl border border-forge-ember/25 bg-gradient-to-b from-forge-ember/[0.08] to-transparent p-4 sm:p-5 lg:sticky lg:top-24 lg:self-start"
          data-tour-id="baseline-add-form"
          noValidate
          ref={formRef}
          onSubmit={handleSubmit}
        >
          <h2 className="font-display text-xl text-white">2. What did you lift?</h2>
          <p className="mt-3 text-sm text-zinc-400">Lift</p>
          <p className="font-display text-2xl leading-tight text-white">{form.exerciseName || "Pick one on the left"}</p>
          {existing ? (
            <p className="mt-1 text-xs text-zinc-500">
              Saved before: {formatWeight(existing.workingWeight)} {unit} × {existing.reps}. Saving replaces it.
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-zinc-200">Weight</span>
              <span className="relative block">
                <input
                  autoComplete="off"
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-4 pr-11 text-lg font-bold tabular-nums text-white outline-none placeholder:font-normal placeholder:text-zinc-600 focus:border-forge-ember/60"
                  inputMode="decimal"
                  placeholder={unit === "lb" ? "185" : "80"}
                  value={form.weight}
                  onChange={(event) => {
                    setForm({ ...form, weight: cleanDecimal(event.target.value) });
                    setFormError("");
                  }}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-zinc-500">{unit}</span>
              </span>
            </label>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-zinc-200" id="baseline-reps">
                Reps
              </p>
              <div aria-labelledby="baseline-reps" className="flex min-h-12 items-center rounded-2xl border border-white/10 bg-white/[0.04]" role="group">
                <button aria-label="One rep fewer" className={iconButton} disabled={reps <= 1} type="button" onClick={() => setForm({ ...form, reps: String(reps - 1) })}>
                  <Minus aria-hidden="true" className="h-4 w-4" />
                </button>
                <span aria-live="polite" className="w-7 text-center text-lg font-bold tabular-nums text-white">
                  {reps}
                </span>
                <button aria-label="One rep more" className={iconButton} disabled={reps >= 30} type="button" onClick={() => setForm({ ...form, reps: String(reps + 1) })}>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-black/25 p-4" data-testid="one-rep-preview">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">Estimated 1-rep max</p>
            <p className="mt-1">
              <span className="font-display text-4xl tabular-nums text-white">{preview ? formatWeight(preview) : "–"}</span>
              {preview ? <span className="ml-1 text-sm font-semibold text-zinc-400">{unit}</span> : null}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {preview && reps > 1
                ? `${formatWeight(form.weight)} ${unit} for ${reps} reps is about ${formatWeight(preview)} ${unit} for one.`
                : "The most you could lift once. Enter a set you did recently."}
            </p>
          </div>

          {formError ? (
            <p className="mt-3 text-sm text-red-300" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            className="mt-4 min-h-12 w-full rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
            disabled={!form.exerciseName || saving}
            type="submit"
          >
            {saving ? "Saving..." : existing ? `Update ${form.exerciseName}` : `Save ${form.exerciseName}`}
          </button>
        </form>
      </div>

      {!loading ? (
        <div className="mt-10 space-y-10" data-tour-id="baseline-estimates">
          <section>
            <h2 className="font-display text-2xl text-white">Your lifts</h2>
            <p className="mt-1 text-sm text-zinc-400">The numbers everything else is worked out from.</p>
            {yourLifts.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {yourLifts.map((baseline, index) => (
                  <YourLiftCard
                    baseline={baseline}
                    estimateCount={estimates.filter((item) => item.sourceExerciseName === baseline.exerciseName).length}
                    index={index}
                    key={baseline._id || baseline.exerciseName}
                    unit={unit}
                    onDelete={setPendingDelete}
                    onUpdate={(item) => selectLift({ name: item.exerciseName })}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-3xl border border-dashed border-white/12 p-6 text-center text-zinc-400">
                Nothing yet. Start with Bench Press, Squat or Deadlift above.
              </p>
            )}
          </section>

          {estimateGroups.length ? (
            <section>
              <h2 className="font-display text-2xl text-white">Estimated for related lifts</h2>
              <p className="mt-1 text-sm text-zinc-400">Conservative starting weights. Adjust by feel on the day.</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {estimateGroups.map(([source, items]) => (
                  <EstimateGroup items={items} key={source} title={source} unit={unit} onDelete={setPendingDelete} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Layout>
  );
};

export default StrengthBaselinesPage;
