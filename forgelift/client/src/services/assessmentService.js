import { request } from "./api.js";

export const assessmentService = {
  getLatestAssessment: () => request("/assessment/latest"),
  completeAssessment: (payload) =>
    request("/assessment/complete", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  skipAssessment: () =>
    request("/assessment/skip", {
      method: "POST"
    }),
  getAssessmentHistory: () => request("/assessment/history"),
  recalculateAssessment: () =>
    request("/assessment/recalculate", {
      method: "POST"
    })
};
