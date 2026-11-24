import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { axiosInstance, unwrap, TOKEN_KEY } from "../api/axiosInstance.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    const res = await axiosInstance.post("/admin/login", { email, password });
    const body = unwrap(res);
    const token = body.token;
    if (!token) throw new Error("No token returned");
    localStorage.setItem(TOKEN_KEY, token);
    const me = await axiosInstance.get("/admin/me");
    setUser(unwrap(me));
    return body;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await axiosInstance.get("/admin/me");
    setUser(unwrap(res));
  }, []);

  const can = useCallback(
    (perm) => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      const p = user.permissions;
      if (!Array.isArray(p)) return false;
      return p.includes(perm);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshMe,
      can,
      isAuthed: !!localStorage.getItem(TOKEN_KEY),
      isSuperAdmin: user?.role === "super_admin",
    }),
    [user, login, logout, refreshMe, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
