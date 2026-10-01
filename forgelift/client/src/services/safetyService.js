import { request } from "./api.js";

export const safetyService = {
  getBlocked: () => request("/safety/blocks"),
  block: (username) =>
    request("/safety/blocks", {
      method: "POST",
      body: JSON.stringify({ username })
    }),
  unblock: (username) => request(`/safety/blocks/${encodeURIComponent(username)}`, { method: "DELETE" }),
  report: (username, reason, details) =>
    request("/safety/reports", {
      method: "POST",
      body: JSON.stringify({ username, reason, details })
    })
};
