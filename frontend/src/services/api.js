const BASE_URL = import.meta.env.VITE_BACKEND_URL;

function getToken() {
  return localStorage.getItem("access_token");
}

function clearSession() {
  localStorage.removeItem("access_token");
}

/**
 * Centralised fetch wrapper.
 *
 * - Automatically attaches Bearer token
 * - Parses JSON (falls back gracefully for non-JSON responses)
 * - On 401: clears session and dispatches a custom event so AuthContext can react
 * - Throws clean Error objects with a `status` property
 *
 * @param {string} endpoint  — path starting with /api/v1/...
 * @param {RequestInit} options — standard fetch options
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse body — handle empty 204 No Content
  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  if (response.status === 401) {
    clearSession();
    // Signal AuthContext to reset its state
    window.dispatchEvent(new Event("auth:unauthorized"));
    const err = new Error((data && data.message) || "Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.detail)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Convenience wrappers ───────────────────────────────────────────────────

export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { method: "GET", ...options }),

  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),

  postForm: (endpoint, formData, options = {}) =>
    apiRequest(endpoint, {
      method: "POST",
      body: formData,
      ...options,
    }),

  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { method: "DELETE", ...options }),
};
