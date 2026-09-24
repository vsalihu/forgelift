import { request } from "./api.js";

export const chatService = {
  getUnreadCount: () => request("/chat/unread-count"),
  getConversations: () => request("/chat/conversations"),
  getConversationWithFriend: (username) => request(`/chat/conversations/with/${encodeURIComponent(username)}`),
  getMessages: (conversationId, before) =>
    request(`/chat/conversations/${conversationId}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  sendMessage: (conversationId, text) =>
    request(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text })
    })
};
