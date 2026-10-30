import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { TOKEN_KEY, pick } from "../lib/api.js";
import { disconnectSocket } from "../lib/socket.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const tokenFrom = (res) => res.data?.data?.authToken ?? res.data?.authToken;

const userFromAuth = (res) => {
  const d = res.data?.data ?? res.data;
  const { authToken, ...u } = d || {};
  return u.user ?? u;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    disconnectSocket();
    setUser(null);
  }, []);

  // Restore session on refresh via GET /auth/me
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api
      .get("/auth/me")
      .then((res) => setUser(pick(res, "user")))
      .catch(clear)
      .finally(() => setLoading(false));
  }, [clear]);

  // Interceptor fires this when any protected request returns 401
  useEffect(() => {
    window.addEventListener("auth:expired", clear);
    return () => window.removeEventListener("auth:expired", clear);
  }, [clear]);

  const finishAuth = (res) => {
    const t = tokenFrom(res);
    if (!t) throw new Error("Sign-in worked but no token came back");
    localStorage.setItem(TOKEN_KEY, t);
    setUser(userFromAuth(res));
  };

  const login = async (email, password) =>
    finishAuth(await api.post("/auth/login", { email, password }));
  const register = async (form) =>
    finishAuth(await api.post("/auth/register", form));

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* token is removed client-side anyway */
    }
    clear();
  };

  const patchUser = (changes) => setUser((u) => ({ ...u, ...changes }));

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, patchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
