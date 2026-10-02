import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Layout from "../components/Layout.jsx";
import AnalyticsTabs from "../components/analytics/AnalyticsTabs.jsx";
import StatTile from "../components/analytics/StatTile.jsx";
import { ACCENT } from "../components/analytics/progress/chartTheme.js";
import { LineChartIcon, MedalIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon, ReportsIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { analyticsService } from "../services/analyticsService.js";

const formatDate = (date) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date));
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const compact = (value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

const card = "rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-6";

// Volume per recent session. One series, so no legend; hover or focus a bar for its readout.
const SessionVolumeChart = ({ workouts, unit }) => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(workouts.length - 1);
  const max = Math.max(...workouts.map((item) => item.totalVolume), 1);
  const shown = workouts[active] || workouts[workouts.length - 1];

  return (
    <div>
      <p aria-live="polite" className="mb-4 min-h-12">
        <span className="font-display block text-3xl tabular-nums text-white">
          {formatNumber(shown.totalVolume)} <span className="text-base text-zinc-400">{unit}</span>
        </span>
        <span className="text-sm text-zinc-400">
          {shown.title || "Workout"} · {formatDate(shown.date)}
        </span>
      </p>
      <div aria-hidden="true" className="relative h-44">
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/[0.07]">
          <span className="absolute -top-2 right-0 bg-[#101215] pl-1.5 text-[0.65rem] tabular-nums text-zinc-500">{compact(max)}</span>
        </div>
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/[0.07]">
          <span className="absolute -top-2 right-0 bg-[#101215] pl-1.5 text-[0.65rem] tabular-nums text-zinc-500">{compact(max / 2)}</span>
        </div>
        <div className="absolute inset-y-0 left-0 right-9 flex items-end gap-1.5 sm:gap-2.5">
          {workouts.map((workout, index) => (
            <div
              className="group flex h-full flex-1 cursor-pointer items-end justify-center"
              key={workout.workoutId}
              onMouseEnter={() => setActive(index)}
            >
              <motion.div
                animate={{ height: `${Math.max(3, (workout.totalVolume / max) * 100)}%` }}
                className="w-full max-w-[44px] rounded-t-[4px] transition-opacity"
                initial={reduce ? false : { height: "0%" }}
                style={{ backgroundColor: ACCENT, opacity: index === active ? 1 : 0.45 }}
                transition={{ duration: 0.6, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mr-9 mt-2 flex gap-1.5 border-t border-white/10 pt-2 sm:gap-2.5">
        {workouts.map((workout, index) => (
          <button
            aria-label={`${workout.title || "Workout"}, ${formatDate(workout.date)}: ${formatNumber(workout.totalVolume)} ${unit}`}
            aria-pressed={index === active}
            className={`flex-1 truncate rounded-md py-1 text-center text-[0.7rem] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${index === active ? "font-bold text-white" : "text-zinc-500"}`}
            key={workout.workoutId}
            type="button"
            onClick={() => setActive(index)}
            onFocus={() => setActive(index)}
            onMouseEnter={() => setActive(index)}
          >
            {new Date(workout.date).getDate()}
          </button>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>Volume of your recent workouts</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Workout</th>
              <th scope="col">Volume ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((workout) => (
              <tr key={workout.workoutId}>
                <td>{formatDate(workout.date)}</td>
                <td>{workout.title}</td>
                <td>{formatNumber(workout.totalVolume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MuscleShare = ({ muscles }) => {
  const total = muscles.reduce((sum, item) => sum + item.totalLoad, 0) || 1;
  const max = Math.max(...muscles.map((item) => item.totalLoad), 1);
  return (
    <ul className="space-y-3">
      {muscles.map((item) => (
        <li className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.75rem] items-center gap-3 text-sm" key={item.muscle}>
          <span className="truncate font-semibold text-zinc-200">{item.muscle}</span>
          <span aria-hidden="true" className="block h-2 overflow-clip rounded-full bg-white/[0.06]">
            <span className="block h-full rounded-full" style={{ width: `${(item.totalLoad / max) * 100}%`, backgroundColor: ACCENT }} />
          </span>
          <span className="text-right font-semibold tabular-nums text-zinc-300">{Math.round((item.totalLoad / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
};

const EXPLORE = [
  { to: "/analytics/advanced", icon: LineChartIcon, title: "Trends", text: "Strength projections, rank pace, consistency and muscle balance." },
  { to: "/progress/prs", icon: MedalIcon, title: "Records", text: "Every personal record you've set, newest first." },
  { to: "/reports/monthly", icon: ReportsIcon, title: "Monthly report", text: "A month in one page, with a summary you can copy and share." }
];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAnalytics(await analyticsService.getProgress());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recent = analytics?.recentWorkoutsVolume || [];
  const muscles = analytics?.topMusclesByLoad || [];

  return (
    <Layout>
      <AnalyticsTabs />
      <PageHeader description="Everything you've logged, added up. Dig into the details from the tabs above." eyebrow="Progress" title="Your training so far" />

      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-28 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
          ))}
        </div>
      ) : null}

      {analytics ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Workouts" tone="accent" value={formatNumber(analytics.totalWorkouts)} />
            <StatTile label="Total volume" sub={`${formatNumber(analytics.totalVolume)} ${unit} lifted`} value={`${compact(analytics.totalVolume)} ${unit}`} />
            <StatTile label="Sets" value={formatNumber(analytics.totalSets)} />
            <StatTile label="Reps" value={formatNumber(analytics.totalReps)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section className={card}>
              <h2 className="font-display text-xl text-white sm:text-2xl">Recent sessions</h2>
              <p className="mb-5 mt-1 text-sm text-zinc-400">Volume (weight × reps) of your last {recent.length || ""} workouts.</p>
              {recent.length ? (
                <SessionVolumeChart unit={unit} workouts={recent} />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/12 p-6 text-center">
                  <p className="text-sm text-zinc-400">Your sessions show up here once you log one.</p>
                  <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-black text-[#160a02]" to="/gym-mode">
                    <GymModeIcon aria-hidden="true" className="h-4 w-4" />
                    Start a workout
                  </Link>
                </div>
              )}
            </section>

            <section className={card}>
              <h2 className="font-display text-xl text-white sm:text-2xl">Where your work goes</h2>
              <p className="mb-5 mt-1 text-sm text-zinc-400">Each muscle's share of your total training load.</p>
              {muscles.length ? <MuscleShare muscles={muscles} /> : <p className="text-sm text-zinc-400">This fills in as you log workouts.</p>}
            </section>
          </div>

          <section aria-labelledby="explore-heading" className="pt-6">
            <h2 className="font-display mb-3 text-xl text-white" id="explore-heading">
              Go deeper
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {EXPLORE.map(({ to, icon: Icon, title, text }) => (
                <Link
                  className="group flex items-start gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 transition-colors hover:border-forge-ember/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  key={to}
                  to={to}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forge-ember/15 text-orange-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-lg text-white">{title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-zinc-400">{text}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="mt-3 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </Layout>
  );
};

export default AnalyticsPage;
