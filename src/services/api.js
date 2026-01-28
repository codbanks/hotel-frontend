// src/services/api.js
import axios from 'axios';

// 1. Determine the correct Base URL based on the environment
const isDevelopment = import.meta.env.MODE === 'development';

const API_BASE = isDevelopment 
  ? import.meta.env.VITE_API_BASE_URL_LOCAL 
  : import.meta.env.VITE_API_BASE_URL_DEPLOY;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// 2. Attach latest access token before every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Handle 401 (Expired Token) and automatically refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to retry this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');

      if (refreshToken) {
        try {
          // Pointing to the v1 token refresh endpoint
          // Note: If your API_BASE doesn't contain '/v2', this replace logic might need adjustment
          const refreshUrl = `${API_BASE.replace('/v2', '/v1')}/token/refresh/`;
          
          const res = await axios.post(refreshUrl, {
            refresh: refreshToken,
          });

          // Save new access token and retry the original request
          localStorage.setItem('access', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          
          return api(originalRequest);
        } catch (err) {
          // If refresh fails, clear everything and send to login
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login'; 
      }
    }

    return Promise.reject(error);
  }
);

export default api;