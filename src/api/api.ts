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
  const url = config.url || "";

  const isAuthEndpoint =
    url.includes("/login/") || url.includes("/token/");

  if (token && !isAuthEndpoint) {
    // ✅ TS-safe (Axios v1)
    config.headers!.Authorization = `Bearer ${token}`;
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
