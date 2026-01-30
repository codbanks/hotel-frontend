// src/services/api.js
import axios from 'axios';

// Create React App uses process.env instead of import.meta.env
const isDevelopment = process.env.NODE_ENV === 'development';

const API_BASE = isDevelopment 
  ? process.env.REACT_APP_API_BASE_URL_LOCAL 
  : process.env.REACT_APP_API_BASE_URL_DEPLOY;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptors remain the same...
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');
      if (refreshToken) {
        try {
          const refreshUrl = `${API_BASE.replace('/v2', '/v1')}/token/refresh/`;
          const res = await axios.post(refreshUrl, { refresh: refreshToken });
          localStorage.setItem('access', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;