import { request } from "./api.js";

const query = (period) => `?period=${period || "month"}`;

export const advancedAnalyticsService = {
  getAnalyticsOverview: (period) => request(`/advanced-analytics/overview${query(period)}`),
  getVolumeTrends: (period) => request(`/advanced-analytics/volume${query(period)}`),
  getStrengthTrends: (period) => request(`/advanced-analytics/strength${query(period)}`),
  getMuscleLoadDistribution: (period) => request(`/advanced-analytics/muscle-load${query(period)}`),
  getInsights: (period) => request(`/advanced-analytics/insights${query(period)}`),
  createSnapshot: (period) =>
    request(`/advanced-analytics/snapshot${query(period)}`, {
      method: "POST"
    })
};
