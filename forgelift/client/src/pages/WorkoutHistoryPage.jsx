import { useEffect, useState } from "react";
import { CalendarDays, Eye, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import { workoutService } from "../services/workoutService.js";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(date));

const getMuscles = (workout) => Object.keys(workout.muscleLoadSummary || workout.muscleVolumeSummary || {});

const WorkoutHistoryPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkouts = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await workoutService.getWorkouts();
      setWorkouts(data.workouts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const deleteWorkout = async (workout) => {
    const confirmed = window.confirm(`Delete "${workout.title}"? This cannot be undone.`);

    if (!confirmed) return;

    try {
      await workoutService.deleteWorkout(workout._id);
      setWorkouts((current) => current.filter((item) => item._id !== workout._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Workout History</p>
          <h1 className="mt-2 text-3xl font-black text-white">Logged sessions</h1>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          to="/workouts/new"
        >
          <Plus className="h-4 w-4" />
          Log workout
        </Link>
      </div>

      {loading ? <p className="text-forge-steel">Loading workouts...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {!loading && !error && workouts.length === 0 ? (
        <div className="metal-panel rounded-lg p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-9 w-9 text-forge-copper" />
          <p className="text-lg font-bold text-white">No workouts logged yet.</p>
          <p className="mt-2 text-slate-400">Start your first session to build your workout history.</p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            to="/workouts/new"
          >
            Start your first session
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {workouts.map((workout) => {
          const muscles = getMuscles(workout);

          return (
            <article className="metal-panel rounded-lg p-5 shadow-metal" key={workout._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-forge-steel">{formatDate(workout.date)}</p>
                  <h2 className="mt-1 text-xl font-black text-white">{workout.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Muscles trained: {muscles.length ? muscles.join(", ") : "None listed"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[34rem]">
                  <div className="rounded-md bg-black/25 p-3">
                    <p className="text-slate-400">Volume</p>
                    <p className="mt-1 font-bold text-white">{workout.totalVolume} kg</p>
                  </div>
                  <div className="rounded-md bg-black/25 p-3">
                    <p className="text-slate-400">Sets</p>
                    <p className="mt-1 font-bold text-white">{workout.totalSets}</p>
                  </div>
                  <div className="rounded-md bg-black/25 p-3">
                    <p className="text-slate-400">Reps</p>
                    <p className="mt-1 font-bold text-white">{workout.totalReps}</p>
                  </div>
                  <div className="rounded-md bg-black/25 p-3">
                    <p className="text-slate-400">RPE</p>
                    <p className="mt-1 font-bold text-white">{workout.sessionRPE || "-"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    to={`/workouts/${workout._id}`}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  <Button type="button" variant="ghost" onClick={() => deleteWorkout(workout)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Layout>
  );
};

export default WorkoutHistoryPage;
