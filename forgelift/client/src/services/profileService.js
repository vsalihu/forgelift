import { request } from "./api.js";

export const profileService = {
  getProfile: (username) => request(`/users/${encodeURIComponent(username)}/profile`)
};
