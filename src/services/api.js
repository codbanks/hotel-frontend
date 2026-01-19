// src/services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api/v2';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach latest access token before every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 and automatically refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE.replace('/v2', '/v1')}/token/refresh/`, {
            refresh: refreshToken,
          });

          // Save new access token
          localStorage.setItem('access', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

          // Retry original request
          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login'; // Redirect to login if refresh fails
        }
      } else {
        window.location.href = '/login'; // No refresh token, force login
      }
    }

    return Promise.reject(error);
  }
);

export default api;
