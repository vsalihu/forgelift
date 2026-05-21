import { request } from "./api.js";

export const recoveryService = {
  getRecoveryScores: () => request("/recovery"),
  recalculateRecovery: () =>
    request("/recovery/recalculate", {
      method: "POST"
    }),
  getMuscleRecovery: (muscleGroup) => request(`/recovery/muscle/${encodeURIComponent(muscleGroup)}`),
  getTodayRecommendation: () => request("/recovery/today")
};
