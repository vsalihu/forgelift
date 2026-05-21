import Workout from "../models/Workout.js";

export const getProgressAnalytics = async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });
    const topMuscleMap = {};

    const totals = workouts.reduce(
      (summary, workout) => {
        summary.totalVolume += workout.totalVolume || 0;
        summary.totalSets += workout.totalSets || 0;
        summary.totalReps += workout.totalReps || 0;

        Object.entries(workout.muscleLoadSummary || {}).forEach(([muscle, load]) => {
          topMuscleMap[muscle] = (topMuscleMap[muscle] || 0) + (load.totalLoad || 0);
        });

        return summary;
      },
      { totalVolume: 0, totalSets: 0, totalReps: 0 }
    );

    const topMusclesByLoad = Object.entries(topMuscleMap)
      .map(([muscle, totalLoad]) => ({ muscle, totalLoad: Math.round(totalLoad * 10) / 10 }))
      .sort((a, b) => b.totalLoad - a.totalLoad)
      .slice(0, 8);

    const recentWorkoutsVolume = workouts
      .slice(0, 8)
      .reverse()
      .map((workout) => ({
        workoutId: workout._id,
        title: workout.title,
        date: workout.date,
        totalVolume: workout.totalVolume || 0
      }));

    return res.json({
      totalWorkouts: workouts.length,
      totalVolume: totals.totalVolume,
      totalSets: totals.totalSets,
      totalReps: totals.totalReps,
      topMusclesByLoad,
      recentWorkoutsVolume
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch progress analytics.", error: error.message });
  }
};
