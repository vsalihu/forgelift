import { request } from "./api.js";

export const activityService = {
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity/feed${query ? `?${query}` : ""}`);
  },
  getInbox: () => request("/activity/inbox"),
  sendWorkout: (workoutTemplateId, friendUserId) =>
    request("/activity/send-workout", {
      method: "POST",
      body: JSON.stringify({ workoutTemplateId, friendUserId })
    }),
  saveInboxWorkout: (sharedWorkoutId) => request(`/activity/inbox/${sharedWorkoutId}/save-template`, { method: "POST" })
};
