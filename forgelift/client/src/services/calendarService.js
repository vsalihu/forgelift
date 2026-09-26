import { request } from "./api.js";

export const calendarService = {
  getMonth: (year, month) => request(`/calendar/${year}/${month}`),
  getPublicMonth: (username, year, month) => request(`/calendar/public/${username}/${year}/${month}`),
  upsertEntry: (payload) =>
    request("/calendar/entries", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteEntry: (id) => request(`/calendar/entries/${id}`, { method: "DELETE" })
};
