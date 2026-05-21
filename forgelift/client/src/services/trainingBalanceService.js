import { request } from "./api.js";

export const trainingBalanceService = {
  getTrainingBalance: () => request("/training-balance"),
  recalculateTrainingBalance: () =>
    request("/training-balance/recalculate", {
      method: "POST"
    })
};
