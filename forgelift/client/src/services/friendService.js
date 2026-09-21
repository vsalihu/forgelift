import { request } from "./api.js";

export const friendService = {
  searchUsers: (username) => request(`/friends/search?username=${encodeURIComponent(username)}`),
  getFriends: () => request("/friends"),
  getRequests: (type) => request(`/friends/requests${type ? `?type=${type}` : ""}`),
  sendRequest: (username) =>
    request("/friends/requests", {
      method: "POST",
      body: JSON.stringify({ username })
    }),
  acceptRequest: (id) => request(`/friends/requests/${id}/accept`, { method: "POST" }),
  declineRequest: (id) => request(`/friends/requests/${id}/decline`, { method: "POST" }),
  removeFriend: (friendUserId) => request(`/friends/${friendUserId}`, { method: "DELETE" }),
  getLeaderboard: () => request("/friends/leaderboard")
};
