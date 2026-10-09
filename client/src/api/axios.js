// Configured axios instance used by every component that talks to the AgriSL API.
//
// Two interceptors are installed:
//  1. REQUEST  — attaches the access token from localStorage as a Bearer header.
//  2. RESPONSE — on 401 TOKEN_EXPIRED, silently fetches a new access token via
//                the refresh endpoint and replays the failed request. The user
//                sees nothing. Any concurrent requests that also 401 are queued
//                and replayed once the single refresh completes.
//
// If the refresh itself fails (token expired / revoked) the user is redirected
// to /login — the only scenario where the session truly ends mid-use.
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY  = 'agrisl_access_token';
const REFRESH_TOKEN_KEY = 'agrisl_refresh_token';

// ── Main axios instance ────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Refresh state ─────────────────────────────────────────────────────────────
// Guards against firing multiple simultaneous refresh requests when several
// protected API calls all 401 at the same time (e.g. on a dashboard that
// fetches 4 resources in parallel).
let isRefreshing = false;
let refreshSubscribers = []; // callbacks waiting for the new access token

function onRefreshComplete(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// ── Request interceptor ────────────────────────────────────────────────────────
// Reads the latest access token from storage each time so rotated tokens are
// always used without needing a React re-render cycle.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that the server explicitly tagged as TOKEN_EXPIRED.
    // Bad-credential 401s (wrong password, missing token) fall through normally.
    // _retried flag prevents an infinite loop if the retried request also 401s.
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retried
    ) {
      originalRequest._retried = true;

      // ── Concurrent-request guard ─────────────────────────────────────────
      if (isRefreshing) {
        // A refresh is already underway — park this request until it completes
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          // No refresh token at all — nothing we can do, send to login
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('agrisl_user');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Exchange the refresh token for a new access token (+ rotated refresh token)
        const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Persist new tokens
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Wake up all queued requests with the new token
        onRefreshComplete(accessToken);

        // Replay the original failed request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh token was expired or revoked — the session is truly over
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('agrisl_user');
        refreshSubscribers = [];
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
