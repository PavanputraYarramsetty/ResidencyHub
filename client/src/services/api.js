import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase JWT and demo role to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    // Non-blocking: fallback to demo/unauthenticated headers if Supabase auth unreachable
    console.warn('Supabase getSession notice:', err.message);
  }
  const demoRole = localStorage.getItem('demo_role');
  if (demoRole) {
    config.headers['x-demo-role'] = demoRole;
  }
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
