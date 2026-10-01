import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import ConsistencyStrip, { buildWeeks, weekStreak } from "../components/history/ConsistencyStrip.jsx";
import { formatNumber } from "../components/gym/gymUtils.js";
import { RepeatIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon, HistoryIcon, LogWorkoutIcon } from "../components/icons/navIcons.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import RowMenu from "../components/ui/RowMenu.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { workoutService } from "../services/workoutService.js";
import { gymDraftInProgress, startInGymMode, templateFromWorkout } from "../utils/gymHandoff.js";

const PAGE_SIZE = 30;

const monthKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}`;
};
const monthLabel = (date) => new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const dayParts = (date) => {
  const value = new Date(date);
  return {
    day: value.getDate(),
    weekday: value.toLocaleDateString("en-US", { weekday: "short" }),
    month: value.toLocaleDateString("en-US", { month: "short" })
  };
};

const topMuscles = (workout) =>
  Object.entries(workout.muscleLoadSummary || {})
    .sort((a, b) => (b[1]?.totalLoad || 0) - (a[1]?.totalLoad || 0))
    .slice(0, 3)
    .map(([muscle]) => muscle);

const exerciseSummary = (workout) => {
  const names = (workout.exercises || []).map((exercise) => exercise.exerciseName);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
};

const Stat = ({ label, value, hint }) => (
  <div className="min-w-0">
    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
    <dd className="font-display mt-1 text-2xl tabular-nums text-white sm:text-3xl">{value}</dd>
    {hint ? <dd className="mt-0.5 text-xs text-zinc-500">{hint}</dd> : null}
  </div>
);

const WorkoutRow = ({ workout, onRepeat, onDelete }) => {
  const { day, weekday, month } = dayParts(workout.date);
  const muscles = topMuscles(workout);

  return (
    <li className="relative">
      <Link
        className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-3 pr-14 transition-[border-color,background-color] hover:border-white/15 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:gap-4 sm:pl-4"
        to={`/workouts/${workout._id}`}
      >
        <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-black/30 py-1.5 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-orange-300/90">{weekday}</span>
          <span className="font-display text-xl leading-none tabular-nums text-white">{day}</span>
          <span className="text-[0.65rem] uppercase tracking-wide text-zinc-500">{month}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-white group-hover:text-orange-50">{workout.title || "Workout"}</span>
          <span className="mt-0.5 block truncate text-sm text-zinc-400">{exerciseSummary(workout) || "No exercises"}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-zinc-500">
            <span>
              <span className="font-bold text-zinc-200">{formatNumber(workout.totalVolume, 0)}</span>kg
            </span>
            <span>
              <span className="font-bold text-zinc-200">{workout.totalSets || 0}</span> sets
            </span>
            {workout.sessionRPE ? (
              <span>
                RPE <span className="font-bold text-zinc-200">{workout.sessionRPE}</span>
              </span>
            ) : null}
            {muscles.length ? <span className="hidden truncate sm:inline">{muscles.join(" · ")}</span> : null}
          </span>
        </span>
      </Link>
      <RowMenu
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
        items={[
          { label: "Repeat in Gym Mode", icon: RepeatIcon, onClick: () => onRepeat(workout) },
          { label: "Edit", icon: Pencil, to: `/workouts/${workout._id}/edit` },
          { label: "Delete", icon: Trash2, tone: "danger", onClick: () => onDelete(workout) }
        ]}
        label={`Options for ${workout.title || "workout"}`}
      />
    </li>
  );
};

const WorkoutHistoryPage = () => {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingRepeat, setPendingRepeat] = useState(null);

  const loadWorkouts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await workoutService.getWorkouts();
      setWorkouts(data.workouts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return workouts;
    return workouts.filter(
      (workout) =>
        (workout.title || "").toLowerCase().includes(term) ||
        (workout.exercises || []).some((exercise) => exercise.exerciseName?.toLowerCase().includes(term))
    );
  }, [workouts, query]);

  const groups = useMemo(() => {
    const result = [];
    filtered.slice(0, visible).forEach((workout) => {
      const key = monthKey(workout.date);
      let group = result[result.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: monthLabel(workout.date), items: [] };
        result.push(group);
      }
      group.items.push(workout);
    });
    return result;
  }, [filtered, visible]);

  const overview = useMemo(() => {
    const now = new Date();
    const thisMonth = workouts.filter((workout) => monthKey(workout.date) === monthKey(now));
    return {
      monthCount: thisMonth.length,
      monthVolume: thisMonth.reduce((total, workout) => total + (workout.totalVolume || 0), 0),
      streak: weekStreak(buildWeeks(workouts, now)),
      total: workouts.length
    };
  }, [workouts]);

  const monthTotals = useMemo(() => {
    const totals = {};
    filtered.forEach((workout) => {
      const key = monthKey(workout.date);
      totals[key] = totals[key] || { count: 0, volume: 0 };
      totals[key].count += 1;
      totals[key].volume += workout.totalVolume || 0;
    });
    return totals;
  }, [filtered]);

  const repeat = (workout) => {
    const template = templateFromWorkout(workout);
    if (gymDraftInProgress()) {
      setPendingRepeat(template);
      return;
    }
    startInGymMode(template, navigate);
  };

  const confirmDeleteWorkout = () => {
    if (!pendingDelete) return;
    const workoutToDelete = pendingDelete;
    setPendingDelete(null);
    setError("");
    setWorkouts((current) => current.filter((item) => item._id !== workoutToDelete._id));

    workoutService.deleteWorkout(workoutToDelete._id).catch((err) => {
      setError(err.message);
      setWorkouts((current) => [...current, workoutToDelete].sort((a, b) => new Date(b.date) - new Date(a.date)));
    });
  };

  const isEmpty = !loading && !error && workouts.length === 0;

  return (
    <Layout>
      {pendingDelete ? (
        <ConfirmModal
          confirmLabel="Delete workout"
          description={`"${pendingDelete.title || "Workout"}" and its PRs will be removed. Ranks and recovery are recalculated. This can't be undone.`}
          title="Delete this workout?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteWorkout}
        />
      ) : null}
      {pendingRepeat ? (
        <ConfirmModal
          cancelLabel="Keep my workout"
          confirmLabel="Repeat this one"
          description="You have a Gym Mode workout in progress. Repeating this session replaces it."
          title="Replace your workout in progress?"
          tone="primary"
          onCancel={() => setPendingRepeat(null)}
          onConfirm={() => startInGymMode(pendingRepeat, navigate)}
        />
      ) : null}

      <div className="mx-auto max-w-3xl">
        <PageHeader
          actions={
            isEmpty ? null : (
            <>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/workouts/new"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Log past session
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-bold text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(249,115,22,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                to="/gym-mode"
              >
                <GymModeIcon className="h-4 w-4" />
                Start Gym Mode
              </Link>
            </>
            )
          }
          eyebrow="Workout history"
          title="Your sessions"
        />

        {error ? <ErrorState message={error} onRetry={loadWorkouts} /> : null}

        {loading ? (
          <div aria-busy="true" aria-label="Loading workouts" className="space-y-3">
            <div className="h-56 animate-pulse rounded-3xl bg-white/[0.04]" />
            {[0, 1, 2, 3].map((item) => (
              <div className="h-[5.5rem] animate-pulse rounded-2xl bg-white/[0.03]" key={item} />
            ))}
          </div>
        ) : null}

        {isEmpty ? (
          <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-transparent px-6 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-forge-ember/30 bg-forge-ember/10 text-orange-200">
              <HistoryIcon className="h-8 w-8" />
            </span>
            <h2 className="font-display mt-5 text-3xl text-white">Nothing here yet.</h2>
            <p className="mx-auto mt-2 max-w-sm text-zinc-400">Every session you finish lands here, with its PRs, volume and the muscles it worked.</p>
            <div className="mx-auto mt-6 grid max-w-xs gap-2.5">
              <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember text-sm font-bold text-[#160a02]" to="/gym-mode">
                <GymModeIcon className="h-4 w-4" />
                Start Gym Mode
              </Link>
              <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] text-sm font-bold text-white" to="/workouts/new">
                <LogWorkoutIcon className="h-4 w-4" />
                Log a past session
              </Link>
            </div>
          </section>
        ) : null}

        {!loading && workouts.length ? (
          <>
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <dl className="grid grid-cols-3 gap-3">
                <Stat hint={`${formatNumber(overview.monthVolume, 0)}kg lifted`} label="This month" value={overview.monthCount} />
                <Stat hint={overview.streak === 1 ? "week in a row" : "weeks in a row"} label="Streak" value={overview.streak} />
                <Stat hint="sessions logged" label="All time" value={overview.total} />
              </dl>
              <div className="mt-6">
                <ConsistencyStrip workouts={workouts} />
              </div>
            </motion.section>

            <div className="mb-2 mt-8">
              <SearchInput placeholder="Search by workout or exercise" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }} />
            </div>

            {!filtered.length ? <p className="py-10 text-center text-zinc-400">No sessions match “{query}”.</p> : null}

            <AnimatePresence initial={false}>
              {groups.map((group) => (
                <section aria-labelledby={`month-${group.key}`} className="mt-6" key={group.key}>
                  <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
                    <h2 className="text-sm font-bold text-zinc-200" id={`month-${group.key}`}>
                      {group.label}
                    </h2>
                    <span className="text-xs tabular-nums text-zinc-500">
                      {monthTotals[group.key]?.count} {monthTotals[group.key]?.count === 1 ? "session" : "sessions"} · {formatNumber(monthTotals[group.key]?.volume, 0)}kg
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((workout) => (
                      <WorkoutRow key={workout._id} workout={workout} onDelete={setPendingDelete} onRepeat={repeat} />
                    ))}
                  </ul>
                </section>
              ))}
            </AnimatePresence>

            {filtered.length > visible ? (
              <button
                className="mt-6 min-h-12 w-full rounded-full border border-white/12 bg-white/[0.04] text-sm font-bold text-white transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
              >
                Show older sessions ({filtered.length - visible} more)
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default WorkoutHistoryPage;
