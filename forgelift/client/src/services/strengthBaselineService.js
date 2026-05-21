import { request } from "./api.js";

export const strengthBaselineService = {
  getStrengthBaselines: () => request("/strength-baselines"),
  saveStrengthBaseline: (payload) =>
    request("/strength-baselines", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateStrengthBaseline: (id, payload) =>
    request(`/strength-baselines/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteStrengthBaseline: (id) =>
    request(`/strength-baselines/${id}`, {
      method: "DELETE"
    }),
  recalculateStrengthBaselines: () =>
    request("/strength-baselines/recalculate", {
      method: "POST"
    })
};
