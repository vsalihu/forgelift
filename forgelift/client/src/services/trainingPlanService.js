import { request } from "./api.js";

export const trainingPlanService = {
  getStatus: () => request("/training-plans/status"),
  generate: (durationWeeks) =>
    request("/training-plans/generate", {
      method: "POST",
      body: JSON.stringify({ durationWeeks })
    }),
  regenerateRemainder: (id) => request(`/training-plans/${id}/regenerate-remainder`, { method: "POST" }),
  cancel: (id) => request(`/training-plans/${id}/cancel`, { method: "POST" })
};
