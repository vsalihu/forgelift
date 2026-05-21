import { useEffect, useMemo, useState } from "react";
import { Medal } from "lucide-react";
import Layout from "../components/Layout.jsx";
import SelectInput from "../components/SelectInput.jsx";
import { exerciseService } from "../services/exerciseService.js";
import { personalRecordService } from "../services/personalRecordService.js";

const recordTypeOptions = [
  { value: "heaviest_weight", label: "Heaviest weight" },
  { value: "best_estimated_1rm", label: "Best estimated 1RM" },
  { value: "best_reps_at_weight", label: "Best reps at weight" },
  { value: "best_volume", label: "Best volume" }
];

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
const formatType = (type) => type.replaceAll("_", " ");

const PRTimelinePage = () => {
  const [personalRecords, setPersonalRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState({ recordType: "", exerciseId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [summaryData, exercisesData] = await Promise.all([
          personalRecordService.getSummary(),
          exerciseService.getExercises()
        ]);
        setSummary(summaryData);
        setExercises(exercisesData.exercises);
      } catch (err) {
        setError(err.message);
      }
    };

    loadBaseData();
  }, []);

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await personalRecordService.getPersonalRecords(filters);
        setPersonalRecords(data.personalRecords);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [filters]);

  const exerciseOptions = useMemo(
    () => exercises.map((exercise) => ({ value: exercise._id, label: exercise.name })),
    [exercises]
  );

  const bestEstimated = useMemo(() => {
    const values = Object.values(summary?.bestEstimated1RMByExercise || {});
    return values.sort((a, b) => b.value - a.value)[0];
  }, [summary]);

  const heaviestLift = useMemo(() => {
    const values = Object.values(summary?.heaviestLiftByExercise || {});
    return values.sort((a, b) => b.value - a.value)[0];
  }, [summary]);

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">PR Timeline</p>
        <h1 className="mt-2 text-3xl font-black text-white">Personal records</h1>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Total PRs", summary?.totalPRs || 0],
          ["Latest PR", summary?.latestPR ? `${summary.latestPR.exerciseName} ${formatType(summary.latestPR.recordType)}` : "-"],
          ["Best estimated 1RM", bestEstimated ? `${bestEstimated.exerciseName} ${formatNumber(bestEstimated.value)}kg` : "-"],
          ["Heaviest lift", heaviestLift ? `${heaviestLift.exerciseName} ${formatNumber(heaviestLift.value)}kg` : "-"]
        ].map(([label, value]) => (
          <div className="metal-panel rounded-lg p-5" key={label}>
            <p className="text-sm text-forge-steel">{label}</p>
            <p className="mt-2 text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="metal-panel mb-6 rounded-lg p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectInput
            label="Record type"
            options={recordTypeOptions}
            value={filters.recordType}
            onChange={(event) => setFilters({ ...filters, recordType: event.target.value })}
          />
          <SelectInput
            label="Exercise"
            options={exerciseOptions}
            value={filters.exerciseId}
            onChange={(event) => setFilters({ ...filters, exerciseId: event.target.value })}
          />
        </div>
      </section>

      {loading ? <p className="text-forge-steel">Loading PR timeline...</p> : null}
      {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error && personalRecords.length === 0 ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <Medal className="mx-auto mb-3 h-9 w-9 text-forge-copper" />
          <p className="text-lg font-bold text-white">No personal records yet.</p>
          <p className="mt-2 text-slate-400">Log completed workout sets to start building your PR timeline.</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {personalRecords.map((record) => (
          <article className="metal-panel rounded-lg p-5" key={record._id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-forge-steel">{formatDate(record.achievedAt)}</p>
                <h2 className="mt-1 text-xl font-black text-white">{record.exerciseName}</h2>
                <p className="mt-2 text-sm font-semibold text-forge-copper">{formatType(record.recordType)}</p>
              </div>
              <p className="text-3xl font-black text-white">{formatNumber(record.value)}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
              {record.weight !== undefined ? <span className="rounded-full bg-white/10 px-3 py-1">Weight {record.weight}kg</span> : null}
              {record.reps !== undefined ? <span className="rounded-full bg-white/10 px-3 py-1">Reps {record.reps}</span> : null}
              {record.estimated1RM ? <span className="rounded-full bg-white/10 px-3 py-1">Est. 1RM {record.estimated1RM}kg</span> : null}
              {record.volume ? <span className="rounded-full bg-white/10 px-3 py-1">Volume {record.volume}kg</span> : null}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
};

export default PRTimelinePage;
