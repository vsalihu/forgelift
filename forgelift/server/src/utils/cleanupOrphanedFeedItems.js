import ActivityFeedItem from "../models/ActivityFeedItem.js";
import Workout from "../models/Workout.js";

export const cleanupOrphanedFeedItems = async () => {
  const completedItems = await ActivityFeedItem.find({ type: "workout_completed" }).select("_id workoutId");
  const existingWorkoutIds = new Set(
    (await Workout.find({ _id: { $in: completedItems.map((item) => item.workoutId) } }).select("_id")).map((workout) =>
      workout._id.toString()
    )
  );
  const orphanedIds = completedItems
    .filter((item) => !item.workoutId || !existingWorkoutIds.has(item.workoutId.toString()))
    .map((item) => item._id);

  if (!orphanedIds.length) {
    return { checked: completedItems.length, removed: 0 };
  }

  await ActivityFeedItem.deleteMany({ _id: { $in: orphanedIds } });
  return { checked: completedItems.length, removed: orphanedIds.length };
};
