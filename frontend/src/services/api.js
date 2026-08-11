import axios from 'axios';

const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://smart-complaint-yd0p.onrender.com';
const apiBaseUrl = import.meta.env.VITE_API_URL || defaultApiBaseUrl;
const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '').endsWith('/api')
  ? apiBaseUrl.replace(/\/$/, '')
  : apiBaseUrl.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

