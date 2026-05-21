import { request } from "./api.js";

export const bodyweightService = {
  getHistory: () => request("/bodyweight"),
  getLatest: () => request("/bodyweight/latest"),
  addEntry: (payload) =>
    request("/bodyweight", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  checkIn: (payload) =>
    request("/bodyweight/check-in", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteEntry: (id) =>
    request(`/bodyweight/${id}`, {
      method: "DELETE"
    })
};
