import axios from "axios";

const BACKEND = import.meta.env.VITE_API_URL || "http://192.168.1.12:8000";

const api = axios.create({
  baseURL: BACKEND,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");

  const url = config.url || "";

  const isAuthEndpoint = url.includes("/login/") || url.includes("/token/");

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (status === 401 && !url.includes("/rooms/") && !url.includes("/tenants/") && !url.includes("/payments/")) {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
    }
    return Promise.reject(error);
  }
);

export default api;
