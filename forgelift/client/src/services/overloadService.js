import { request } from "./api.js";

export const overloadService = {
  getOverloadRecommendations: () => request("/overload"),
  getExerciseOverloadRecommendation: (exerciseName) =>
    request(`/overload/exercise/${encodeURIComponent(exerciseName)}`),
  recalculateOverloadRecommendations: () =>
    request("/overload/recalculate", {
      method: "POST"
    }),
  updateOverloadStatus: (id, status) =>
    request(`/overload/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
};
