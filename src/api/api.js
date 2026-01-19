import axios from "axios";

// Match your Django URL
const BASE_URL = "http://localhost:8000/api/v2";

// Create a standalone axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Auto-attach token
api.interceptors.request.use(
  (config) => {
    // We use sessionStorage so it dies when browser closes
    const token = sessionStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Auto-refresh on 401
api.interceptors.response.use(
  (response) => response, // If success, just return response
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't tried refreshing yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem("refresh");

      if (refreshToken) {
        try {
          // Attempt to get a new access token
          const res = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          // Success: Save new token to session
          const newAccess = res.data.access;
          sessionStorage.setItem("access", newAccess);

          // Update header and retry the failed request
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed (token expired completely) -> Logout user
          console.error("Session expired:", refreshError);
          sessionStorage.clear();
          window.location.href = "/"; // Hard redirect to login
        }
      } else {
        // No refresh token available -> Logout
        sessionStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;