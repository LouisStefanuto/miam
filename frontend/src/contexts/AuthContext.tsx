import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '@/lib/config';
import { handleCfRedirect } from '@/lib/api';

interface User {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  /** Whether the user is authenticated (has a valid session cookie) */
  isAuthenticated: boolean;
  /** Decoded user info from Google credential */
  user: User | null;
  /** True while checking for a stored session */
  isLoading: boolean;
  /** Exchange a Google credential for a backend JWT */
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Clear session */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'miam-auth-user';

/** Decode the payload of a Google ID token (JWT) to extract display info. */
function parseGoogleCredential(credential: string): User {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]));
    return {
      name: payload.name ?? payload.email ?? 'User',
      email: payload.email ?? '',
      picture: payload.picture,
    };
  } catch {
    return { name: 'User', email: '' };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user display info from localStorage and verify the cookie is still valid.
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }
    setUser(JSON.parse(storedUser));
    // Verify the HttpOnly cookie is still valid
    fetch(`${API_BASE}/auth/me`, { credentials: 'same-origin', redirect: 'manual' })
      .then((res) => {
        if (handleCfRedirect(res)) return; // CF session expired — navigating to login
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      })
      .catch(() => {
        // Network error — assume valid to avoid logging out offline users
        setIsAuthenticated(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: credential }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Login failed: ${detail}`);
    }
    // The JWT is now set as an HttpOnly cookie by the backend.
    // We only store non-sensitive display info in localStorage.
    const userInfo = parseGoogleCredential(credential);
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setIsAuthenticated(true);
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    // Ask the backend to clear the HttpOnly cookie
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Best-effort; the cookie will expire on its own
    }
    localStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ isAuthenticated, user, isLoading, loginWithGoogle, logout }),
    [isAuthenticated, user, isLoading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
