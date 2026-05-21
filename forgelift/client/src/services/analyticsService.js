import { request } from "./api.js";

export const analyticsService = {
  getProgress: () => request("/analytics/progress")
};
