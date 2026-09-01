import axios from 'axios';

const normalizeOrigin = (value = '') => {
  if (!value) return '';
  return value.trim().replace(/\/+$/, '').replace(/\/api$/, '');
};

const getApiOrigin = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeOrigin(envUrl);
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    if (hostname.endsWith('.vercel.app')) {
      return 'https://support-flow-backend1.vercel.app';
    }
    return normalizeOrigin(window.location.origin);
  }
  return '';
};

const API_ORIGIN = getApiOrigin();

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and state on invalid/expired token if not on auth routes
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/signup') &&
          !window.location.pathname.startsWith('/forgot-password')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
