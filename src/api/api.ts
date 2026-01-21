import axios from "axios";

const BACKEND = import.meta.env.VITE_API_URL || "http://192.168.1.12:8000";

const api = axios.create({
  baseURL: BACKEND,
  timeout: 15000,
});

// Attach token if present. Skip for login endpoints.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("ACCESS_TOKEN");
    const url = config.url || "";
    console.log(`[API] ${config.method?.toUpperCase()} ${url} - token: ${token ? "✅ present" : "❌ missing"}`);
    
    // Skip auth header for login endpoint
    if (token && !url.includes("/login/")) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Added Authorization header`);
    }
  } catch (e) {
    console.error("[API] Request interceptor error:", e);
  }
  return config;
});

// On 401 clear tokens to avoid repeated token_not_valid responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    
    // Only clear tokens on 401 for non-fetch endpoints
    // (fetch endpoints may get 401 due to token expiry during the session)
    if (status === 401 && !url.includes("/rooms/") && !url.includes("/tenants/") && !url.includes("/payments/")) {
      console.warn("API 401 — clearing stored tokens");
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
    }
    return Promise.reject(error);
  }
);

export default api;
