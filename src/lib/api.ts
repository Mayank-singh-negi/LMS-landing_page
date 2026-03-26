const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Session expired");

  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("accessToken");
  // Don't set Content-Type for FormData — browser sets it with boundary automatically
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // spread options.headers last only for non-auth overrides, but never let it override Authorization
      ...(options?.headers as Record<string, string> ?? {}),
      // always enforce Authorization from localStorage, not from caller
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // If 401, try to refresh token once then retry
  if (res.status === 401) {
    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push((newToken: string) => {
          request<T>(path, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
              ...options?.headers,
            },
          }).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];
      isRefreshing = false;

      // Retry original request with new token
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          ...(!isFormData ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${newToken}`,
        },
      });
      const retryContentType = retryRes.headers.get("content-type") ?? "";
      const retryData = retryContentType.includes("application/json") ? await retryRes.json() : null;
      if (!retryRes.ok) throw new Error((retryData as { message?: string })?.message || "Request failed");
      return retryData as T;
    } catch (err) {
      isRefreshing = false;
      refreshQueue = [];
      // Refresh failed — clear storage and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw err;
    }
  }

  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) throw new Error(res.status === 401 ? "Invalid email or password." : res.status === 404 ? "Not found." : `Server error (${res.status})`);
    throw new Error(text || "Unexpected response from server");
  }
  if (!res.ok) throw new Error((data as { message?: string }).message || "Request failed");
  return data as T;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  get: <T>(path: string) => request<T>(path),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  // multipart/form-data upload — no Content-Type header so browser sets boundary automatically
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
  patchForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "PATCH", body: formData }),
};
