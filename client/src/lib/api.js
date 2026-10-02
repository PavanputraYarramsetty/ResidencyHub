import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const role = sessionStorage.getItem('demo_role') || localStorage.getItem('demo_role');
  if (role) {
    config.headers['x-demo-role'] = role;
    config.headers.Authorization = `Bearer mock-token-${role}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
