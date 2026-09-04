import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach demo role and authorization header to every request
api.interceptors.request.use((config) => {
  const demoRole = localStorage.getItem('demo_role') || 'owner';
  config.headers['x-demo-role'] = demoRole;
  config.headers.Authorization = `Bearer mock-token-${demoRole}`;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle API responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
