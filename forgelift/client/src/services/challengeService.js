import { request } from "./api.js";

export const challengeService = {
  getChallenges: () => request("/challenges"),
  getChallenge: (id) => request(`/challenges/${id}`),
  createChallenge: (payload) =>
    request("/challenges", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  respond: (id, accept) =>
    request(`/challenges/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ accept })
    })
};
