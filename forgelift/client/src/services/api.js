const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("forgeliftToken");

// The API host sleeps when idle. Pinging it as soon as someone opens the login or sign-up page
// starts it waking up while they type. Fire-and-forget, once per page load.
let wakeRequested = false;
export const wakeServer = () => {
  if (wakeRequested) return;
  wakeRequested = true;
  fetch(`${API_URL}/health`).catch(() => {
    wakeRequested = false;
  });
};

// timeoutMs: give up after this long instead of waiting forever on a dropped connection.
export const request = async (endpoint, { timeoutMs, ...options } = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      ...(controller ? { signal: controller.signal } : {})
    });
  } catch (fetchError) {
    const error = new Error(
      fetchError?.name === "AbortError" ? "The server took too long to answer." : "Couldn't reach the server. Check your connection and try again."
    );
    error.status = 0;
    error.network = true;
    throw error;
  } finally {
    if (timer) window.clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("forgeliftToken");
      window.dispatchEvent(new Event("forgelift:auth-expired"));
    }

    const error = new Error(data.message || "Something went wrong.");
    error.status = response.status;
    error.field = data.field || null;
    throw error;
  }

  return data;
};

export const api = {
  checkUsername: (username) => request(`/public/username-available?username=${encodeURIComponent(username)}`),
  searchPublicCities: (q) => request(`/public/cities?q=${encodeURIComponent(q)}`),
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMe: () => request("/users/me"),
  updateProfile: (payload) =>
    request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  markReleaseSeen: (releaseId) =>
    request("/users/whats-new", {
      method: "PUT",
      body: JSON.stringify({ releaseId })
    }),
  completeOnboarding: (payload) =>
    request("/users/onboarding", {
      method: "PUT",
      body: JSON.stringify(payload)
    })
};
