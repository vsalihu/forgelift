import { request } from "./api.js";

const toQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
};

export const competitionService = {
  searchCities: (q) => request(`/competitions/cities${toQuery({ q })}`),
  getMine: () => request("/competitions/me"),
  join: (payload) =>
    request("/competitions/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  leave: () => request("/competitions/me", { method: "DELETE" }),
  pinBoard: (board) =>
    request("/competitions/me/featured", {
      method: "PUT",
      body: JSON.stringify(board)
    }),
  getLeaderboard: (filters) => request(`/competitions/leaderboard${toQuery(filters)}`),
  getStanding: () => request("/competitions/standing"),
  markStandingSeen: (boardKey, place) =>
    request("/competitions/standing/seen", {
      method: "POST",
      body: JSON.stringify({ boardKey, place })
    })
};
