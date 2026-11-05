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
  createTodo: (day, todo) =>
    request(`/daily/todos?day=${day}&offset=${offset()}`, {
      method: "POST",
      body: JSON.stringify(todo),
      timeoutMs: 60000
    }),
  updateTodo: (day, id, todo) =>
    request(`/daily/todos/${id}?day=${day}&offset=${offset()}`, {
      method: "PUT",
      body: JSON.stringify(todo),
      timeoutMs: 60000
    }),
  deleteTodo: (day, id) =>
    request(`/daily/todos/${id}?day=${day}&offset=${offset()}`, {
      method: "DELETE",
      timeoutMs: 60000
    }),
  updateProfile: (body) =>
    request("/daily/profile", {
      method: "PUT",
      body: JSON.stringify(body),
      timeoutMs: 60000
    })
};
