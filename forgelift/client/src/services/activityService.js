import { request } from "./api.js";

export const activityService = {
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity/feed${query ? `?${query}` : ""}`);
  },
  shareWorkout: (workoutTemplateId) =>
    request("/activity/share-workout", {
      method: "POST",
      body: JSON.stringify({ workoutTemplateId })
    }),
  saveSharedTemplate: (feedItemId) => request(`/activity/feed/${feedItemId}/save-template`, { method: "POST" })
};
