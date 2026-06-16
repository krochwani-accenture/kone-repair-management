import { useState, useEffect, useCallback } from 'react';

export interface User {
  username: string;
  role: 'global' | 'region';
  regions: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isLoggedIn: false,
  });

  // Load auth from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAuthState({
          token: parsed.token,
          user: parsed.user,
          isLoggedIn: !!parsed.token,
        });
      }
    } catch (err) {
      console.error('Failed to load auth from storage:', err);
      localStorage.removeItem('auth');
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      const newState: AuthState = {
        token: data.token,
        user: data.user,
        isLoggedIn: true,
      };

      setAuthState(newState);
      localStorage.setItem('auth', JSON.stringify(newState));
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      token: null,
      user: null,
      isLoggedIn: false,
    });
    localStorage.removeItem('auth');
  }, []);

  const getAuthHeader = useCallback(() => {
    if (!authState.token) return {};
    return {
      'Authorization': `Bearer ${authState.token}`,
    };
  }, [authState.token]);

  return {
    ...authState,
    login,
    logout,
    getAuthHeader,
  };
}
