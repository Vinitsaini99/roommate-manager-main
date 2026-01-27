import axios from "axios";

const BACKEND =
  import.meta.env.VITE_API_URL || "https://albenuspeter.pythonanywhere.com/";

const api = axios.create({
  baseURL: BACKEND,
  timeout: 1500000,
});

/* ===================== REQUEST ===================== */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  const tenantId = localStorage.getItem("TENANT_ID");
  const url = config.url || "";

  const isAuthEndpoint =
    url.includes("/login/") || url.includes("/token/");

  if (token && !isAuthEndpoint) {
    // Check if it's a tenant token
    if (token.startsWith("TENANT_")) {
      // For tenant requests, include tenant ID in headers
      config.headers!["X-Tenant-ID"] = tenantId || "";
      config.headers!.Authorization = `Bearer ${token}`;
    } else {
      // For admin JWT tokens
      config.headers!.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* ===================== RESPONSE ===================== */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isAuthEndpoint =
      url.includes("/login/") || url.includes("/token/");

    if (status === 401 && !isAuthEndpoint) {
      console.warn("🔐 Token expired → logout");
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
      localStorage.removeItem("rentease_user");
    }

    return Promise.reject(error);
  }
);

export default api;
