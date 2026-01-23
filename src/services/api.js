import axios from 'axios';

// Updated to your live Render URL and v1 path
const API_BASE = 'https://hotel-backend-h8nz.onrender.com/api/v1';

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
          // Simplified to use the same v1 base path
          const res = await axios.post(`${API_BASE}/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

          return api(originalRequest);
        } catch (err) {
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