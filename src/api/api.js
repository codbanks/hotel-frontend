import axios from 'axios';

const isDevelopment = process.env.NODE_ENV === 'development';

const API_BASE = isDevelopment 
  ? process.env.REACT_APP_API_BASE_URL_LOCAL 
  : process.env.REACT_APP_API_BASE_URL_DEPLOY;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Attach the Token
api.interceptors.request.use(
  (config) => {
    // 🔴 CHANGED: strict usage of sessionStorage to match App.js
    const token = sessionStorage.getItem('access'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // 🔴 CHANGED: Look for refresh token in sessionStorage
      const refreshToken = sessionStorage.getItem('refresh');

      if (refreshToken) {
        try {
          const cleanBase = API_BASE.replace(/\/$/, '').replace('/v1', '');
          const refreshUrl = `${cleanBase}/v1/token/refresh/`;

          const res = await axios.post(refreshUrl, { refresh: refreshToken });

          // 🔴 CHANGED: Update sessionStorage
          sessionStorage.setItem('access', res.data.access);
          
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (err) {
          // 🔴 CHANGED: Clear session if refresh fails
          sessionStorage.clear(); 
          window.location.href = '/login'; 
        }
      } else {
        // If no refresh token, logout immediately
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;