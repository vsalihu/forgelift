import { request } from "./api.js";

export const weakPointService = {
  getWeakPoints: () => request("/weak-points"),
  recalculateWeakPoints: () =>
    request("/weak-points/recalculate", {
      method: "POST"
    }),
  getWeakPointHistory: () => request("/weak-points/history")
};
