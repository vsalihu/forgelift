import { request } from "./api.js";

export const tutorialService = {
  getTutorialProgress: () => request("/tutorials/progress"),
  getPageTutorialProgress: (pageKey) => request(`/tutorials/progress/${pageKey}`),
  updateTutorialProgress: (pageKey, data) =>
    request(`/tutorials/progress/${pageKey}`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  resetTutorial: (pageKey) =>
    request(`/tutorials/reset/${pageKey}`, {
      method: "POST"
    }),
  resetAllTutorials: () =>
    request("/tutorials/reset-all", {
      method: "POST"
    })
};
