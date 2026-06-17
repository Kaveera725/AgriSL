import axios from 'axios';

const TOKEN_KEY = 'agrisl_token';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach the JWT from localStorage to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: when a request with an existing session token is rejected
// as unauthorized (e.g. the token expired), clear it and bounce to /login. Login
// attempts have no token yet, so bad-credential 401s fall through to the form.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
