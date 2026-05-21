import { request } from "./api.js";

const toQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const exerciseService = {
  getExercises: (filters) => request(`/exercises${toQueryString(filters)}`),
  getExercise: (id) => request(`/exercises/${id}`),
  createExercise: (payload) =>
    request("/exercises", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createCustomExercise: (payload) =>
    request("/exercises/custom", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCustomExercise: (id, payload) =>
    request(`/exercises/custom/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteCustomExercise: (id) =>
    request(`/exercises/custom/${id}`, {
      method: "DELETE"
    })
};
