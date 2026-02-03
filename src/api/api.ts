import axios from "axios";

const BACKEND = import.meta.env.VITE_API_URL || "http://192.168.1.4:8000/";

console.info("[api] using backend:", BACKEND);

const api = axios.create({
  baseURL: BACKEND,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===================== REQUEST ===================== */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  const tenantId = localStorage.getItem("TENANT_ID");
  const url = config.url || "";

  const isAuthEndpoint =
    url.includes("/login/") || url.includes("/token/");

  if (token && !isAuthEndpoint) {
    if (token.startsWith("TENANT_")) {
      config.headers!["X-Tenant-ID"] = tenantId || "";
      config.headers!.Authorization = `Bearer ${token}`;
    } else {
      config.headers!.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* ===================== RESPONSE ===================== */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("[api] request failed", {
      url: error?.config?.url,
      status: error?.response?.status,
      message: error?.message,
      responseData: error?.response?.data,
    });

    if (
      error?.response?.status === 401 &&
      !error?.config?.url?.includes("/login/")
    ) {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
      localStorage.removeItem("rentease_user");
    }

    return Promise.reject(error);
  }
);

export default api;
