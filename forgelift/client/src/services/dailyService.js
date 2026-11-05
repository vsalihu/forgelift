import { request } from "./api.js";

const offset = () => new Date().getTimezoneOffset();

export const dailyService = {
  getDay: (day) => request(`/daily/${day}?offset=${offset()}`, { timeoutMs: 60000 }),
  updateDay: (day, body) =>
    request(`/daily/${day}?offset=${offset()}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      timeoutMs: 60000
    }),
  updateProfile: (body) =>
    request("/daily/profile", {
      method: "PUT",
      body: JSON.stringify(body),
      timeoutMs: 60000
    })
};
