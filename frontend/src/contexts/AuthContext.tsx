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

interface User {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  /** JWT access token, null when not authenticated */
  token: string | null;
  /** Decoded user info from Google credential */
  user: User | null;
  /** True while checking for a stored session */
  isLoading: boolean;
  /** Exchange a Google credential for a backend JWT */
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Clear session */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'miam-auth-token';
const USER_KEY = 'miam-auth-user';

/** Decode the payload of a Google ID token (JWT) to extract user info. */
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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: credential }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Login failed: ${detail}`);
    }
    const { access_token } = await res.json();
    const userInfo = parseGoogleCredential(credential);

    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setToken(access_token);
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ token, user, isLoading, loginWithGoogle, logout }),
    [token, user, isLoading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
