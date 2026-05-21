import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { workoutService } from "../services/workoutService.js";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);

const WorkoutDetailPage = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [overloadRecommendations, setOverloadRecommendations] = useState([]);
  const [deloadRecommendations, setDeloadRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <Layout>
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forge-ember" to="/workouts">
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Link>

      {loading ? <p className="text-forge-steel">Loading workout...</p> : null}
      {error ? <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {workout ? (
        <>
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">
              {formatDate(workout.date)}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{workout.title}</h1>
          </div>

          <section className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              ["Total volume", `${workout.totalVolume} kg`],
              ["Total sets", workout.totalSets],
              ["Total reps", workout.totalReps],
              ["Average RPE", workout.averageRPE || "-"],
              ["Heaviest weight", `${workout.heaviestWeight || 0} kg`],
              ["Best estimated 1RM", `${workout.bestEstimated1RM || 0} kg`],
              ["Completed sets", workout.completedSetCount || 0],
              ["Failed sets", workout.failedSetCount || 0]
            ].map(([label, value]) => (
              <div className="metal-panel rounded-lg p-5" key={label}>
                <p className="text-sm text-forge-steel">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="space-y-4">
              {workout.exercises.map((exercise, exerciseIndex) => (
                <article className="metal-panel rounded-lg p-5" key={`${exercise.exerciseName}-${exerciseIndex}`}>
                  <h2 className="text-xl font-black text-white">{exercise.exerciseName}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Primary: {exercise.primaryMuscles.join(", ") || "Not listed"}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md bg-black/25 p-3">
                      <p className="text-xs text-slate-400">Exercise volume</p>
                      <p className="mt-1 font-bold text-white">{formatNumber(exercise.exerciseTotalVolume)} kg</p>
                    </div>
                    <div className="rounded-md bg-black/25 p-3">
                      <p className="text-xs text-slate-400">Best estimated 1RM</p>
                      <p className="mt-1 font-bold text-white">{formatNumber(exercise.exerciseBestEstimated1RM)} kg</p>
                    </div>
                    <div className="rounded-md bg-black/25 p-3">
                      <p className="text-xs text-slate-400">Average RPE</p>
                      <p className="mt-1 font-bold text-white">{exercise.exerciseAverageRPE || "-"}</p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[52rem] text-left text-sm">
                      <thead className="text-slate-400">
                        <tr className="border-b border-white/10">
                          <th className="py-3">Set</th>
                          <th className="py-3">Weight</th>
                          <th className="py-3">Reps</th>
                          <th className="py-3">Volume</th>
                          <th className="py-3">Est. 1RM</th>
                          <th className="py-3">RPE</th>
                          <th className="py-3">Done</th>
                          <th className="py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIndex) => (
                          <tr className="border-b border-white/5 text-slate-200" key={setIndex}>
                            <td className="py-3">{setIndex + 1}</td>
                            <td className="py-3">{set.weight}</td>
                            <td className="py-3">{set.reps}</td>
                            <td className="py-3">{formatNumber(set.setVolume)}</td>
                            <td className="py-3">{formatNumber(set.estimated1RM)}</td>
                            <td className="py-3">{set.rpe || "-"}</td>
                            <td className="py-3">{set.completed ? "Yes" : "No"}</td>
                            <td className="py-3 text-slate-400">{set.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {overloadRecommendations.find(
                    (recommendation) => recommendation.exerciseName === exercise.exerciseName
                  ) ? (
                    <div className="mt-5 rounded-md border border-forge-copper/30 bg-forge-ember/10 p-4">
                      {(() => {
                        const recommendation = overloadRecommendations.find(
                          (item) => item.exerciseName === exercise.exerciseName
                        );

                        return (
                          <>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="font-bold text-white">Latest overload target</h3>
                              <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-orange-200">
                                {recommendation.recommendationType.replaceAll("_", " ")}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-md bg-black/25 p-3">
                                <p className="text-xs text-slate-400">Next weight</p>
                                <p className="mt-1 font-bold text-white">
                                  {formatNumber(recommendation.recommendedWeight)} kg
                                </p>
                              </div>
                              <div className="rounded-md bg-black/25 p-3">
                                <p className="text-xs text-slate-400">Rep target</p>
                                <p className="mt-1 font-bold text-white">{recommendation.recommendedRepTarget}</p>
                              </div>
                              <div className="rounded-md bg-black/25 p-3">
                                <p className="text-xs text-slate-400">Confidence</p>
                                <p className="mt-1 font-bold text-white">{recommendation.confidence}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-300">{recommendation.reason}</p>
                            {recommendation.warnings?.length ? (
                              <ul className="mt-3 space-y-1 text-sm text-orange-200">
                                {recommendation.warnings.map((warning) => (
                                  <li key={warning}>{warning}</li>
                                ))}
                              </ul>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}

                  {deloadRecommendations.find(
                    (recommendation) =>
                      recommendation.exerciseName === exercise.exerciseName ||
                      (recommendation.muscleGroup &&
                        [
                          ...(exercise.primaryMuscles || []),
                          ...(exercise.secondaryMuscles || []),
                          ...(exercise.stabiliserMuscles || [])
                        ].includes(recommendation.muscleGroup))
                  ) ? (
                    <div className="mt-5 rounded-md border border-orange-400/20 bg-orange-500/10 p-4">
                      {(() => {
                        const recommendation = deloadRecommendations.find(
                          (item) =>
                            item.exerciseName === exercise.exerciseName ||
                            (item.muscleGroup &&
                              [
                                ...(exercise.primaryMuscles || []),
                                ...(exercise.secondaryMuscles || []),
                                ...(exercise.stabiliserMuscles || [])
                              ].includes(item.muscleGroup))
                        );

                        return (
                          <>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="font-bold text-white">Deload warning</h3>
                              <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-orange-200">
                                {recommendation.severity} {recommendation.recommendationType.replaceAll("_", " ")}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-orange-100">{recommendation.reason}</p>
                            {recommendation.reductionPercentage ? (
                              <p className="mt-2 text-sm text-slate-400">
                                Recommended reduction: {formatNumber(recommendation.reductionPercentage)}%.
                              </p>
                            ) : null}
                            {recommendation.plan?.nextSessionTarget ? (
                              <p className="mt-2 text-sm text-slate-400">{recommendation.plan.nextSessionTarget}</p>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </article>
              ))}
            </section>

            <aside className="space-y-4">
              <section className="metal-panel rounded-lg p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-forge-ember" />
                  <h2 className="text-xl font-bold text-white">Muscle load</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(workout.muscleLoadSummary || {}).map(([muscle, load]) => (
                    <div className="rounded-md border border-white/10 bg-black/20 p-4" key={muscle}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-white">{muscle}</h3>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                          {load.loadLevel}
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-400">Direct</dt>
                          <dd className="text-white">{formatNumber(load.directLoad)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-400">Indirect</dt>
                          <dd className="text-white">{formatNumber(load.indirectLoad)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-400">Stabiliser</dt>
                          <dd className="text-white">{formatNumber(load.stabiliserLoad)}</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-white/10 pt-2">
                          <dt className="text-slate-300">Total</dt>
                          <dd className="font-bold text-white">{formatNumber(load.totalLoad)}</dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        {load.directLoad > 0
                          ? `${muscle} was directly trained in this workout.`
                          : load.indirectLoad > 0
                            ? `${muscle} was indirectly loaded by related movements. This may affect tomorrow's heavy work.`
                            : `${muscle} acted as a stabiliser during this workout.`}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="metal-panel rounded-lg p-5">
                <h2 className="text-xl font-bold text-white">PRs achieved</h2>
                {personalRecords.length ? (
                  <div className="mt-4 space-y-3">
                    {personalRecords.map((record) => (
                      <div className="rounded-md bg-forge-ember/10 p-3 text-sm" key={record._id}>
                        <p className="font-bold text-white">{record.exerciseName}</p>
                        <p className="mt-1 text-orange-200">
                          {record.recordType.replaceAll("_", " ")}: {formatNumber(record.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No personal records were detected for this workout.</p>
                )}
              </section>

              <section className="metal-panel rounded-lg p-5">
                <h2 className="text-xl font-bold text-white">Session notes</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{workout.notes || "No notes added."}</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Soreness</dt>
                    <dd className="text-white">{workout.soreness || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Sleep quality</dt>
                    <dd className="text-white">{workout.sleepQuality || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Energy level</dt>
                    <dd className="text-white">{workout.energyLevel || "-"}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </Layout>
  );
};

export default WorkoutDetailPage;
