import { request } from "./api.js";

export const workoutTemplateService = {
  getTemplates: () => request("/workout-templates"),
  getTemplate: (id) => request(`/workout-templates/${id}`),
  createTemplate: (payload) =>
    request("/workout-templates", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTemplate: (id, payload) =>
    request(`/workout-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteTemplate: (id) =>
    request(`/workout-templates/${id}`, {
      method: "DELETE"
    })
};
