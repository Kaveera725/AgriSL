// Global auth state — stores the access JWT, refresh token, decoded user payload,
// and login/logout helpers. Tokens are persisted in localStorage so sessions
// survive page refreshes. The access token is silently refreshed 2 minutes before
// expiry so the user is never interrupted mid-session.
import React, { createContext, useContext, useState,
  useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY  = 'agrisl_access_token';
const REFRESH_TOKEN_KEY = 'agrisl_refresh_token';
const USER_KEY          = 'agrisl_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef       = useRef(null);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const clearAllTokens = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const saveTokens = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── silent token refresh ─────────────────────────────────────────────────────
  // Schedules a background refresh 2 minutes before the access token expires.
  // The farmer never sees an expiry error — the new token is swapped in silently.
  const scheduleTokenRefresh = useCallback((expiresInSeconds = 2700) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    // Refresh 2 minutes (120 s) before expiry
    const refreshInMs = (expiresInSeconds - 120) * 1000;

    if (refreshInMs <= 0) {
      // Token already expired or about to — try now
      performSilentRefresh();
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      performSilentRefresh();
    }, refreshInMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSilentRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      clearAllTokens();
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

      // Update tokens in storage (rotation: server sent a new refresh token too)
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      // Schedule the next silent refresh
      scheduleTokenRefresh(expiresIn || 2700);

    } catch {
      // Refresh token expired or revoked — force the user to log in again
      clearAllTokens();
    }
  }, [clearAllTokens, scheduleTokenRefresh]);

  // ── initialise from localStorage on page load ──────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const accessToken  = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const savedUser    = localStorage.getItem(USER_KEY);

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Decode token to check expiry without making a network call.
        // Signature verification happens on the server for every protected request.
        const base64Payload = accessToken.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;

        if (timeUntilExpiry <= 0) {
          // Access token already expired — attempt silent refresh with refresh token
          await performSilentRefresh();
        } else {
          // Access token still valid — restore user state and schedule next refresh
          if (savedUser) setUser(JSON.parse(savedUser));
          scheduleTokenRefresh(timeUntilExpiry);
        }
      } catch {
        // Corrupted/tampered token — wipe everything
        clearAllTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── public API ───────────────────────────────────────────────────────────────
  const login = useCallback((accessToken, refreshToken, userData, expiresIn = 2700) => {
    saveTokens(accessToken, refreshToken, userData);
    scheduleTokenRefresh(expiresIn);
  }, [saveTokens, scheduleTokenRefresh]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessToken  = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Tell the server to revoke this refresh token so rotation stays clean
    if (refreshToken && accessToken) {
      try {
        await axios.post(
          `${API_BASE}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch {
        // Network error is fine — local tokens are cleared regardless
      }
    }

    clearAllTokens();
  }, [clearAllTokens]);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook for consuming auth context. Throws loudly if called outside an AuthProvider
// so misconfigured routes fail immediately during development.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
