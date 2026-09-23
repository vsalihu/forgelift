import { request } from "./api.js";

export const coopSessionService = {
  getActive: () => request("/coop-sessions/active"),
  getSession: (id) => request(`/coop-sessions/${id}`),
  createSession: (payload) =>
    request("/coop-sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  respond: (id, accept) =>
    request(`/coop-sessions/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ accept })
    }),
  updateProgress: (id, payload) =>
    request(`/coop-sessions/${id}/progress`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  finish: (id, workoutId) =>
    request(`/coop-sessions/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({ workoutId })
    })
};
