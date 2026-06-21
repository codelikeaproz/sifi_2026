import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearTokens,
  getMe,
  isLoggedIn,
  login as apiLogin,
  type AuthUser,
  type Region,
} from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
  isHeadOfficer: boolean;
  canManageUsers: boolean;
  assignedRegion: Region | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(!isLoggedIn());

  const refreshUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthReady(true);
      return;
    }
    try {
      const profile = await getMe();
      setUser(profile);
      setIsAuthenticated(true);
    } catch {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn()) {
      void refreshUser();
    }
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isHeadOfficer = user?.role === "head_officer";
  const canManageUsers = isAdmin;
  const assignedRegion = isHeadOfficer ? user?.region ?? null : null;

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthReady,
      user,
      isAdmin,
      isHeadOfficer,
      canManageUsers,
      assignedRegion,
      login,
      logout,
      refreshUser,
    }),
    [
      isAuthenticated,
      isAuthReady,
      user,
      isAdmin,
      isHeadOfficer,
      canManageUsers,
      assignedRegion,
      login,
      logout,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
