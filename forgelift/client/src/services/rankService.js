import { request } from "./api.js";

export const rankService = {
  getRanks: () => request("/ranks"),
  recalculateRanks: () =>
    request("/ranks/recalculate", {
      method: "POST"
    }),
  getMuscleRank: (muscleGroup) => request(`/ranks/muscle/${encodeURIComponent(muscleGroup)}`)
};
