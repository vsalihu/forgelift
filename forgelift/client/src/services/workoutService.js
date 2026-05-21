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
  createWorkout: (payload) =>
    request("/workouts", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateWorkout: (id, payload) =>
    request(`/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteWorkout: (id) =>
    request(`/workouts/${id}`, {
      method: "DELETE"
    })
};
