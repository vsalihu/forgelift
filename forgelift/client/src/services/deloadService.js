import { request } from "./api.js";

export const deloadService = {
  getDeloadRecommendations: () => request("/deload"),
  getDeloadHistory: () => request("/deload/history"),
  getPlateaus: () => request("/deload/plateaus"),
  getFatigue: () => request("/deload/fatigue"),
  recalculateDeload: () =>
    request("/deload/recalculate", {
      method: "POST"
    }),
  updateDeloadStatus: (id, status) =>
    request(`/deload/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
};
