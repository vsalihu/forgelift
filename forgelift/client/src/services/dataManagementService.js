import { request } from "./api.js";

export const dataManagementService = {
  getDataSummary: () => request("/data-management/summary"),
  deleteDataRange: (payload) =>
    request("/data-management/delete-range", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  resetTrainingData: (payload) =>
    request("/data-management/reset-training", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  resetStrengthBaselines: () =>
    request("/data-management/reset-strength-baselines", {
      method: "POST",
      body: JSON.stringify({ confirm: true })
    })
};
