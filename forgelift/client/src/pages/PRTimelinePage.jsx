import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "../components/Layout.jsx";
import AnalyticsTabs from "../components/analytics/AnalyticsTabs.jsx";
import StatTile from "../components/analytics/StatTile.jsx";
import FilterSelect from "../components/exercises/FilterSelect.jsx";
import { FirstPlaceIcon, MedalIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { exerciseService } from "../services/exerciseService.js";
import { personalRecordService } from "../services/personalRecordService.js";

const TYPES = [
  { value: "", label: "All records" },
  { value: "heaviest_weight", label: "Heaviest weight" },
  { value: "best_estimated_1rm", label: "Best 1-rep max" },
  { value: "best_reps_at_weight", label: "Most reps" },
  { value: "best_volume", label: "Best set volume" }
];
const typeLabel = (type) => TYPES.find((item) => item.value === type)?.label || type?.replaceAll("_", " ");

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const formatDay = (date) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date));
const formatMonth = (date) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(date));
const valueWithUnit = (record, unit) => (record.recordType === "best_reps_at_weight" ? `${formatNumber(record.value)} reps` : `${formatNumber(record.value)} ${unit}`);

const RecordCard = ({ record, unit, index }) => {
  const reduce = useReducedMotion();
  const details = [
    record.weight !== undefined && record.reps !== undefined ? `${formatNumber(record.weight)} ${unit} × ${record.reps}` : record.weight !== undefined ? `${formatNumber(record.weight)} ${unit}` : "",
    record.recordType !== "best_estimated_1rm" && record.estimated1RM ? `1-rep max ≈ ${formatNumber(record.estimated1RM)} ${unit}` : "",
    record.recordType !== "best_volume" && record.volume ? `${formatNumber(record.volume)} ${unit} volume` : ""
  ].filter(Boolean);

  return (
    <motion.li
      animate={{ opacity: 1, x: 0 }}
      className="relative pl-8"
      initial={reduce ? false : { opacity: 0, x: -8 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
    >
      <span aria-hidden="true" className="absolute left-[7px] top-6 h-3 w-3 rounded-full border-2 border-[#07080a] bg-forge-ember shadow-[0_0_0_3px_rgba(249,115,22,0.18)]" />
      <article className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-orange-300">{typeLabel(record.recordType)}</p>
            <h3 className="font-display mt-0.5 text-lg leading-snug text-white">{record.exerciseName}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{formatDay(record.achievedAt)}</p>
          </div>
          <p className="font-display shrink-0 text-right text-2xl tabular-nums text-white">{valueWithUnit(record, unit)}</p>
        </div>
        {details.length ? <p className="mt-3 text-sm text-zinc-400">{details.join(" · ")}</p> : null}
      </article>
    </motion.li>
  );
};

const PRTimelinePage = () => {
  const { user } = useAuth();
  const unit = user?.preferredUnits === "imperial" ? "lb" : "kg";
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState({ recordType: "", exerciseId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([personalRecordService.getSummary(), exerciseService.getExercises()])
      .then(([summaryData, exerciseData]) => {
        setSummary(summaryData);
        setExercises(exerciseData.exercises || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await personalRecordService.getPersonalRecords(filters);
      setRecords(data.personalRecords || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const exerciseOptions = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)).map((exercise) => ({ value: exercise._id, label: exercise.name })),
    [exercises]
  );
  const best = (map) => Object.values(map || {}).sort((a, b) => b.value - a.value)[0];
  const bestEstimated = useMemo(() => best(summary?.bestEstimated1RMByExercise), [summary]);
  const heaviest = useMemo(() => best(summary?.heaviestLiftByExercise), [summary]);
  const months = useMemo(() => {
    const groups = new Map();
    records.forEach((record) => {
      const key = formatMonth(record.achievedAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    return [...groups.entries()];
  }, [records]);
  const filtered = filters.recordType || filters.exerciseId;

  return (
    <Layout>
      <AnalyticsTabs />
      <PageHeader description="Every personal record you've set, newest first." eyebrow="Records" title="Your personal records" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={MedalIcon} label="Records set" tone="accent" value={formatNumber(summary?.totalPRs)} />
        <StatTile label="Latest" sub={summary?.latestPR ? typeLabel(summary.latestPR.recordType) : "None yet"} value={summary?.latestPR?.exerciseName || "–"} />
        <StatTile label="Best 1-rep max" sub={bestEstimated?.exerciseName || "None yet"} value={bestEstimated ? `${formatNumber(bestEstimated.value)} ${unit}` : "–"} />
        <StatTile icon={FirstPlaceIcon} label="Heaviest lift" sub={heaviest?.exerciseName || "None yet"} value={heaviest ? `${formatNumber(heaviest.value)} ${unit}` : "–"} />
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div aria-label="Record type" className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0" role="group">
          {TYPES.map((type) => {
            const active = filters.recordType === type.value;
            return (
              <button
                aria-pressed={active}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                  active ? "border-transparent bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02]" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                }`}
                key={type.value || "all"}
                type="button"
                onClick={() => setFilters({ ...filters, recordType: type.value })}
              >
                {type.label}
              </button>
            );
          })}
        </div>
        <FilterSelect anyLabel="Every exercise" label="Exercise" options={exerciseOptions} value={filters.exerciseId} onChange={(exerciseId) => setFilters({ ...filters, exerciseId })} />
      </div>

      {error ? <div className="mt-6"><ErrorState message={error} onRetry={loadRecords} /></div> : null}

      {loading ? (
        <div aria-busy="true" className="mt-6 space-y-3">
          {[0, 1, 2].map((item) => (
            <div className="h-24 animate-pulse rounded-3xl bg-white/[0.03]" key={item} />
          ))}
        </div>
      ) : null}

      {!loading && !error && !records.length ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/12 px-6 py-12 text-center">
          <MedalIcon aria-hidden="true" className="mx-auto h-10 w-10 text-orange-300" />
          <p className="font-display mt-3 text-2xl text-white">{filtered ? "No records match." : "No records yet."}</p>
          <p className="mx-auto mt-2 max-w-md text-zinc-400">
            {filtered ? "Try another record type or exercise." : "Beat something you've done before and it shows up here. Your first session of a lift sets the bar."}
          </p>
          {!filtered ? (
            <Link className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-6 text-sm font-black text-[#160a02]" to="/gym-mode">
              <GymModeIcon aria-hidden="true" className="h-4 w-4" />
              Start a workout
            </Link>
          ) : null}
        </div>
      ) : null}

      {!loading && records.length ? (
        <div className="mt-6 space-y-8">
          {months.map(([month, items]) => (
            <section aria-label={month} key={month}>
              <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-zinc-400">
                <span className="font-display text-lg text-white">{month}</span>
                {items.length} record{items.length === 1 ? "" : "s"}
              </h2>
              <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[12px] before:top-4 before:w-px before:bg-white/10">
                {items.map((record, index) => (
                  <RecordCard index={index} key={record._id} record={record} unit={unit} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </Layout>
  );
};

export default PRTimelinePage;
