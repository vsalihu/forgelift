import { useEffect, useState } from "react";
import { BarChart3, FileText, LineChart, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { analyticsService } from "../services/analyticsService.js";

const formatDate = (date) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date));
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await analyticsService.getProgress();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Progress</p>
        <h1 className="mt-2 text-3xl font-black text-white">Analytics foundation</h1>
      </div>

      {loading ? <p className="text-forge-steel">Loading progress analytics...</p> : null}
      {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {analytics ? (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              ["Total workouts", analytics.totalWorkouts],
              ["Total volume", `${formatNumber(analytics.totalVolume)}kg`],
              ["Total sets", analytics.totalSets],
              ["Total reps", analytics.totalReps]
            ].map(([label, value]) => (
              <div className="metal-panel rounded-lg p-5" key={label}>
                <p className="text-sm text-forge-steel">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="metal-panel rounded-lg p-5">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-forge-ember" />
                <h2 className="text-xl font-bold text-white">Recent volume trend</h2>
              </div>
              {analytics.recentWorkoutsVolume.length ? (
                <div className="space-y-3">
                  {analytics.recentWorkoutsVolume.map((workout) => {
                    const maxVolume = Math.max(...analytics.recentWorkoutsVolume.map((item) => item.totalVolume), 1);
                    const width = Math.max(6, (workout.totalVolume / maxVolume) * 100);

                    return (
                      <div key={workout.workoutId}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="text-slate-300">{workout.title}</span>
                          <span className="text-slate-400">{formatDate(workout.date)} · {formatNumber(workout.totalVolume)}kg</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-forge-copper to-forge-ember" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400">No workout volume data yet.</p>
              )}
            </section>

            <section className="metal-panel rounded-lg p-5">
              <h2 className="text-xl font-bold text-white">Top muscles by load</h2>
              {analytics.topMusclesByLoad.length ? (
                <div className="mt-5 space-y-3">
                  {analytics.topMusclesByLoad.map((item) => (
                    <div className="flex justify-between gap-4 text-sm" key={item.muscle}>
                      <span className="text-slate-300">{item.muscle}</span>
                      <span className="font-bold text-white">{formatNumber(item.totalLoad)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Muscle load appears after Stage 3 workouts are logged.</p>
              )}
            </section>
          </div>

          <Link
            className="metal-panel mt-6 flex items-center justify-between gap-4 rounded-lg p-5 transition hover:border-forge-copper/60"
            to="/analytics/advanced"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Advanced Analytics</p>
              <h2 className="mt-2 text-xl font-black text-white">Charts, insights, and progress trends</h2>
            </div>
            <LineChart className="h-8 w-8 text-forge-ember" />
          </Link>

          <Link
            className="metal-panel mt-6 flex items-center justify-between gap-4 rounded-lg p-5 transition hover:border-forge-copper/60"
            to="/reports/monthly"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Monthly Reports</p>
              <h2 className="mt-2 text-xl font-black text-white">Generate a copyable monthly summary</h2>
            </div>
            <FileText className="h-8 w-8 text-forge-ember" />
          </Link>

          <Link
            className="metal-panel mt-6 flex items-center justify-between gap-4 rounded-lg p-5 transition hover:border-forge-copper/60"
            to="/progress/prs"
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">PR Timeline</p>
              <h2 className="mt-2 text-xl font-black text-white">Review personal records</h2>
            </div>
            <Medal className="h-8 w-8 text-forge-ember" />
          </Link>
        </>
      ) : null}
    </Layout>
  );
};

export default AnalyticsPage;
