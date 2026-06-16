// Global auth state — stores the JWT, decoded user payload, and login/logout helpers.
// Token is persisted in localStorage under TOKEN_KEY so sessions survive page refreshes.
import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'agrisl_token';
const AuthContext = createContext(null);

// Decode a JWT and return its payload only if it is still valid (not expired).
function decodeValid(token) {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Provides auth state to the entire app. loading=true until the localStorage
// check resolves so ProtectedRoute doesn't flash a redirect on first render.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore the session from localStorage if the token is valid.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      const decoded = decodeValid(stored);
      if (decoded) {
        setToken(stored);
        setUser(decoded);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Stores the token and decoded payload. Returns false if the token is invalid
  // or already expired so callers can surface an error without crashing.
  function login(tokenString) {
    const decoded = decodeValid(tokenString);
    if (!decoded) return false;
    localStorage.setItem(TOKEN_KEY, tokenString);
    setToken(tokenString);
    setUser(decoded);
    return true;
  }

  // Clears all auth state and removes the token from storage.
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for consuming auth context. Throws if called outside an AuthProvider
// so misconfigured routes fail loudly during development.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
