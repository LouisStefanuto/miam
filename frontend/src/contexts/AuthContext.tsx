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
  /** User profile returned by the backend on login */
  user: User | null;
  /** True while checking for a stored session */
  isLoading: boolean;
  /** Exchange a Google authorization code for a backend session */
  loginWithGoogle: (code: string) => Promise<void>;
  /** Clear session */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'miam-auth-user';

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

  const loginWithGoogle = useCallback(async (code: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (handleCfRedirect(res)) return;
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Login failed: ${detail}`);
    }
    // The JWT is set as an HttpOnly cookie; the response also carries
    // non-sensitive display info we mirror into localStorage for restore.
    const body = await res.json();
    const userInfo: User = {
      name: body.user?.name ?? 'User',
      email: body.user?.email ?? '',
      picture: body.user?.picture,
    };
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
