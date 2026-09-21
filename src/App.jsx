import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastViewport from "./components/ToastViewport";
import { useAuth } from "./context/AuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import QuestionBankPage from "./pages/QuestionBankPage";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { AUTH_EXPIRED_EVENT } from "./services/api";
import { getStorageItem, setStorageItem } from "./utils/storage";

const THEME_KEY = "notesphere-theme";
const DEFAULT_META = {
  title: "NoteSphere | Study Notes and Question Papers",
  description: "Browse curated study notes and question papers for faster exam preparation."
};

const ROUTE_META = {
  "/": DEFAULT_META,
  "/explore": {
    title: "Explore Study Notes | NoteSphere",
    description: "Search and preview curated study notes by title, subject, and course on NoteSphere."
  },
  "/question-bank": {
    title: "Browse Question Papers | NoteSphere",
    description: "Find previous question papers by subject, university, course, semester, year, and exam type."
  },
  "/auth": {
    title: "Login or Signup | NoteSphere",
    description: "Access your NoteSphere account to browse notes, question papers, and study activity."
  },
  "/forgot-password": {
    title: "Reset Password | NoteSphere",
    description: "Request a secure password reset link for your NoteSphere account."
  }
};

function AppContent({ isDark, onToggleTheme, reloadKey, showToast, triggerReload }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const metadata = ROUTE_META[location.pathname] || DEFAULT_META;
    document.title = metadata.title;
    setMetaTag("description", metadata.description);
    setMetaProperty("og:title", metadata.title);
    setMetaProperty("og:description", metadata.description);
    setMetaProperty("og:url", `https://www.noteshapre.in${location.pathname}`);
    setMetaTag("twitter:title", metadata.title);
    setMetaTag("twitter:description", metadata.description);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    showToast("Logged out successfully.", "info");
    navigate("/");
  }

  return (
    <Layout isDark={isDark} onToggleTheme={onToggleTheme} onLogout={handleLogout} showToast={showToast}>
      <Routes>
        <Route path="/" element={<HomePage reloadKey={reloadKey} showToast={showToast} />} />
        <Route path="/explore" element={<ExplorePage onNotesChanged={triggerReload} showToast={showToast} />} />
        <Route path="/question-bank" element={<QuestionBankPage showToast={showToast} />} />
        <Route path="/auth" element={<AuthPage showToast={showToast} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage showToast={showToast} />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage showToast={showToast} />} />
        <Route path="/admin-login" element={<AdminLoginPage showToast={showToast} />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage onNotesChanged={triggerReload} showToast={showToast} />} />
          <Route path="/profile" element={<ProfilePage showToast={showToast} />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/upload" element={<UploadPage onNotesChanged={triggerReload} showToast={showToast} />} />
          <Route path="/admin" element={<AdminPage onNotesChanged={triggerReload} showToast={showToast} />} />
        </Route>
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [toasts, setToasts] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDark);
    setStorageItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  function showToast(message, type = "info") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, type, leaving: false }]);

    window.setTimeout(() => {
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
      );
    }, 2400);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }

  useEffect(() => {
    function handleAuthExpired(event) {
      showToast(event.detail?.message || "Your session has expired. Please log in again.", "error");
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  return (
    <>
      <div className={`loader${isLoading ? "" : " is-hidden"}`} aria-hidden={!isLoading}>
        <div className="loader__orb"></div>
        <p>Launching your study space...</p>
      </div>

      <BrowserRouter>
        <ErrorBoundary>
          <AppContent
            isDark={isDark}
            onToggleTheme={() => setIsDark((current) => !current)}
            reloadKey={reloadKey}
            triggerReload={() => setReloadKey((current) => current + 1)}
            showToast={showToast}
          />
        </ErrorBoundary>
      </BrowserRouter>

      <ToastViewport toasts={toasts} />
    </>
  );
}

function getInitialTheme() {
  const savedTheme = getStorageItem(THEME_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return savedTheme ? savedTheme === "dark" : prefersDark;
}

function setMetaTag(name, content) {
  const element = document.querySelector(`meta[name="${name}"]`);
  if (element) {
    element.setAttribute("content", content);
  }
}

function setMetaProperty(property, content) {
  const element = document.querySelector(`meta[property="${property}"]`);
  if (element) {
    element.setAttribute("content", content);
  }
}
