import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach the JWT from localStorage to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrisl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
