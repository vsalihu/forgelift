import { request } from "./api.js";

export const missionService = {
  getMissions: () => request("/missions"),
  getMissionHistory: () => request("/missions/history"),
  generateMissions: () =>
    request("/missions/generate", {
      method: "POST"
    }),
  recalculateMissions: () =>
    request("/missions/recalculate", {
      method: "POST"
    }),
  updateMissionStatus: (id, status) =>
    request(`/missions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  getWeeklyTarget: () => request("/missions/weekly-target")
};
