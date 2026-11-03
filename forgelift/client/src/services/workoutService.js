import { request } from "./api.js";

const toQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const workoutService = {
  getWorkouts: (filters) => request(`/workouts${toQueryString(filters)}`),
  getRecentExercises: () => request("/workouts/recent-exercises"),
  getWorkout: (id) => request(`/workouts/${id}`),
  // Saving also updates ranks, recovery and missions, and the API host may be waking up, so allow
  // well over a cold start before giving up. Retrying is safe: the payload carries clientRequestId.
  createWorkout: (payload) =>
    request("/workouts", {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: 90000
    }),
  updateWorkout: (id, payload) =>
    request(`/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      timeoutMs: 90000
    }),
  // A 404 means it is already gone (an earlier try got through), which is what the user asked for.
  deleteWorkout: (id) =>
    request(`/workouts/${id}`, {
      method: "DELETE",
      timeoutMs: 90000
    }).catch((error) => {
      if (error.status === 404) return { message: "Workout deleted.", alreadyDeleted: true };
      throw error;
    })
};

// One id per finished session, sent with the save so a retry can never log the workout twice.
export const newClientRequestId = () =>
  window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
