import { createContext, useContext, useEffect, useState } from "react";
import api, { AUTH_EXPIRED_EVENT } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "notesphere-token";
const USER_KEY = "notesphere-user";

function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(getStoredUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  function persistUser(nextUser) {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem(USER_KEY);
  }

  useEffect(() => {
    async function hydrateUser() {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        persistUser(response.data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken("");
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    hydrateUser();
  }, [token]);

  useEffect(() => {
    function handleAuthExpired() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken("");
      setUser(null);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  async function signup(payload) {
    const response = await api.post("/auth/signup", payload);
    setToken(response.data.token);
    persistUser(response.data.user);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async function login(payload) {
    const response = await api.post("/auth/login", payload);
    setToken(response.data.token);
    persistUser(response.data.user);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async function loginAdmin(payload) {
    const response = await api.post("/admin/login", payload);
    setToken(response.data.token);
    persistUser(response.data.user);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async function refreshUser() {
    if (!token) {
      persistUser(null);
      return null;
    }

    const response = await api.get("/auth/me");
    persistUser(response.data.user);
    return response.data.user;
  }

  function updateCurrentUser(nextUser) {
    persistUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        isAuthLoading,
        login,
        loginAdmin,
        logout,
        refreshUser,
        signup,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
