import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { formatNumber, recordLabels, recordUnit } from "../components/gym/gymUtils.js";
import { FirstPlaceIcon, RepeatIcon } from "../components/icons/featureIcons.jsx";
import { BalanceIcon } from "../components/icons/navIcons.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import RowMenu from "../components/ui/RowMenu.jsx";
import ExerciseBreakdown from "../components/workoutDetail/ExerciseBreakdown.jsx";
import MuscleLoadChart from "../components/workoutDetail/MuscleLoadChart.jsx";
import { workoutService } from "../services/workoutService.js";
import { gymDraftInProgress, startInGymMode, templateFromWorkout } from "../utils/gymHandoff.js";

const EASE = [0.16, 1, 0.3, 1];

const formatWhen = (date) => {
  const value = new Date(date);
  return `${value.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · ${value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

const Panel = ({ title, icon: Icon, children, className = "" }) => (
  <section className={`rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5 ${className}`}>
    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
      {Icon ? <Icon className="h-4 w-4 text-orange-300" /> : null}
      {title}
    </h2>
    {children}
  </section>
);

// A 1 to 10 rating as a meter on its own track.
const FeelMeter = ({ label, value }) => (
  <div>
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className="tabular-nums text-zinc-500">
        <span className="font-bold text-white">{value}</span>/10
      </span>
    </div>
    <div aria-label={`${label}: ${value} out of 10`} aria-valuemax={10} aria-valuemin={1} aria-valuenow={value} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f97316]/15" role="meter">
      <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${value * 10}%` }} />
    </div>
  </div>
);

const recordText = (record) =>
  record.recordType === "best_reps_at_weight"
    ? `${record.value} reps at ${formatNumber(record.weight)}kg`
    : `${formatNumber(record.value)}${recordUnit(record.recordType)}`;

const WorkoutDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [workout, setWorkout] = useState(null);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [deloadRecommendations, setDeloadRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await workoutService.getWorkout(id);
        setWorkout(data.workout);
        setPersonalRecords(data.personalRecords || []);
        setOverloadRecommendations(data.overloadRecommendations || []);
        setDeloadRecommendations(data.deloadRecommendations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadWorkout();
  }, [id]);

  const repeat = (force = false) => {
    if (!force && gymDraftInProgress()) {
      setConfirmRepeat(true);
      return;
    }
    startInGymMode(templateFromWorkout(workout), navigate);
  };

  const deleteWorkout = async () => {
    setDeleting(true);
    try {
      await workoutService.deleteWorkout(id);
      navigate("/workouts");
    } catch (err) {
      setError(err.message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const deloadFor = (exercise) => {
    const muscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || []), ...(exercise.stabiliserMuscles || [])];
    return deloadRecommendations.find((item) => item.exerciseName === exercise.exerciseName || (item.muscleGroup && muscles.includes(item.muscleGroup)));
  };

  const feel = workout
    ? [
        ["Session effort", workout.sessionRPE],
        ["Soreness", workout.soreness],
        ["Sleep", workout.sleepQuality],
        ["Energy", workout.energyLevel]
      ].filter(([, value]) => Number(value) > 0)
    : [];

  const rise = (delay = 0) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: EASE } });

  return (
    <Layout>
      {confirmDelete ? (
        <ConfirmModal
          confirmLabel="Delete workout"
          description="Its PRs will be removed and your ranks and recovery recalculated. This can't be undone."
          loading={deleting}
          title="Delete this workout?"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={deleteWorkout}
        />
      ) : null}
      {confirmRepeat ? (
        <ConfirmModal
          cancelLabel="Keep my workout"
          confirmLabel="Repeat this one"
          description="You have a Gym Mode workout in progress. Repeating this session replaces it."
          title="Replace your workout in progress?"
          tone="primary"
          onCancel={() => setConfirmRepeat(false)}
          onConfirm={() => repeat(true)}
        />
      ) : null}

      <div className="mx-auto max-w-5xl">
        <Link className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" to="/workouts">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          History
        </Link>

        {error ? <ErrorState message={error} /> : null}

        {loading ? (
          <div aria-busy="true" aria-label="Loading workout" className="space-y-3">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/[0.04]" />
            <div className="h-72 animate-pulse rounded-3xl bg-white/[0.03]" />
          </div>
        ) : null}

        {workout ? (
          <>
            <motion.header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between" {...rise(0)}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-orange-300">{formatWhen(workout.date)}</p>
                <h1 className="font-display mt-1 break-words text-[2.1rem] leading-[1.05] text-white sm:text-5xl">{workout.title || "Workout"}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(249,115,22,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 active:scale-[0.98] lg:flex-none"
                  aria-label="Repeat in Gym Mode"
                  type="button"
                  onClick={() => repeat()}
                >
                  <RepeatIcon className="h-4 w-4" />
                  <span className="min-[400px]:hidden">Repeat</span>
                  <span className="hidden min-[400px]:inline">Repeat in Gym Mode</span>
                </button>
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  to={`/workouts/${workout._id}/edit`}
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                  Edit
                </Link>
                <RowMenu items={[{ label: "Delete workout", icon: Trash2, tone: "danger", onClick: () => setConfirmDelete(true) }]} label="More options" />
              </div>
            </motion.header>

            <motion.dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4" {...rise(0.06)}>
              {[
                ["Volume", `${formatNumber(workout.totalVolume, 0)}kg`],
                ["Sets", workout.totalSets || 0],
                ["Reps", workout.totalReps || 0],
                ["Avg RPE", workout.averageRPE ? formatNumber(workout.averageRPE) : "–"]
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4" key={label}>
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
                  <dd className="font-display mt-1 text-2xl tabular-nums text-white sm:text-3xl">{value}</dd>
                </div>
              ))}
            </motion.dl>
            <motion.p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm text-zinc-500" {...rise(0.1)}>
              <span>
                Heaviest <span className="font-bold tabular-nums text-zinc-200">{formatNumber(workout.heaviestWeight)}kg</span>
              </span>
              <span>
                Best e1RM <span className="font-bold tabular-nums text-zinc-200">{formatNumber(workout.bestEstimated1RM)}kg</span>
              </span>
              {workout.failedSetCount ? (
                <span>
                  Failed sets <span className="font-bold tabular-nums text-red-300">{workout.failedSetCount}</span>
                </span>
              ) : null}
            </motion.p>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
              <motion.section aria-labelledby="exercises-heading" className="space-y-3" {...rise(0.14)}>
                <h2 className="font-display text-2xl text-white" id="exercises-heading">
                  Exercises <span className="font-sans text-base font-semibold text-zinc-500">{workout.exercises.length}</span>
                </h2>
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <ExerciseBreakdown
                    deload={deloadFor(exercise)}
                    exercise={exercise}
                    index={exerciseIndex}
                    key={`${exercise.exerciseName}-${exerciseIndex}`}
                    overload={overloadRecommendations.find((item) => item.exerciseName === exercise.exerciseName)}
                    recordCount={personalRecords.filter((record) => record.exerciseName === exercise.exerciseName).length}
                  />
                ))}
              </motion.section>

              <motion.aside className="space-y-4 lg:sticky lg:top-24" {...rise(0.2)}>
                {personalRecords.length ? (
                  <section className="rounded-3xl border border-forge-ember/25 bg-gradient-to-br from-forge-ember/[0.12] to-transparent p-4 sm:p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                      <FirstPlaceIcon className="h-4 w-4" />
                      Personal records · {personalRecords.length}
                    </h2>
                    <ul className="space-y-2.5">
                      {personalRecords.map((record) => (
                        <li className="flex items-baseline justify-between gap-3 text-sm" key={record._id || `${record.exerciseName}-${record.recordType}-${record.value}`}>
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-white">{record.exerciseName}</span>
                            <span className="block text-xs text-zinc-400">{recordLabels[record.recordType] || "Record"}</span>
                          </span>
                          <span className="shrink-0 font-bold tabular-nums text-orange-200">{recordText(record)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <Panel icon={BalanceIcon} title="Muscle load">
                  <MuscleLoadChart summary={workout.muscleLoadSummary} />
                </Panel>

                {feel.length || workout.notes ? (
                  <Panel title="How it felt">
                    {feel.length ? (
                      <div className="space-y-3">
                        {feel.map(([label, value]) => (
                          <FeelMeter key={label} label={label} value={Number(value)} />
                        ))}
                      </div>
                    ) : null}
                    {workout.notes ? <p className={`whitespace-pre-line text-sm leading-6 text-zinc-300 ${feel.length ? "mt-4 border-t border-white/[0.06] pt-4" : ""}`}>{workout.notes}</p> : null}
                  </Panel>
                ) : null}
              </motion.aside>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default WorkoutDetailPage;
