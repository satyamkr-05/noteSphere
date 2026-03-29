import { createContext, useContext, useEffect, useState } from "react";
import api, { AUTH_EXPIRED_EVENT } from "../services/api";
import { getStorageItem, removeStorageItem, setStorageItem } from "../utils/storage";

const AuthContext = createContext(null);

const TOKEN_KEY = "notesphere-token";
const USER_KEY = "notesphere-user";

function getStoredUser() {
  const storedUser = getStorageItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    removeStorageItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStorageItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(getStoredUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  function persistUser(nextUser) {
    setUser(nextUser);

    if (nextUser) {
      setStorageItem(USER_KEY, JSON.stringify(nextUser));
      return;
    }

    removeStorageItem(USER_KEY);
  }

  useEffect(() => {
    let isActive = true;

    async function hydrateUser() {
      if (!token) {
        if (isActive) {
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (isActive) {
          persistUser(response.data.user);
        }
      } catch {
        if (isActive) {
          removeStorageItem(TOKEN_KEY);
          removeStorageItem(USER_KEY);
          setToken("");
          setUser(null);
        }
      } finally {
        if (isActive) {
          setIsAuthLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    function handleAuthExpired() {
      removeStorageItem(TOKEN_KEY);
      removeStorageItem(USER_KEY);
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
    setStorageItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async function login(payload) {
    const response = await api.post("/auth/login", payload);
    setToken(response.data.token);
    persistUser(response.data.user);
    setStorageItem(TOKEN_KEY, response.data.token);
    return response.data;
  }

  async function loginAdmin(payload) {
    const response = await api.post("/admin/login", payload);
    setToken(response.data.token);
    persistUser(response.data.user);
    setStorageItem(TOKEN_KEY, response.data.token);
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
    removeStorageItem(TOKEN_KEY);
    removeStorageItem(USER_KEY);
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
