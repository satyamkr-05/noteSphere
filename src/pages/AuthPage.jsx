import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import { getErrorMessage } from "../services/api";

export default function AuthPage({ showToast }) {
  const { isAuthenticated, isAuthLoading, login, signup } = useAuth();
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useReveal([authMode]);

  if (isAuthLoading) {
    return <div className="page-status glass-card">Checking your session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={searchParams.get("redirect") || "/dashboard"} replace />;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      await login(loginForm);
      showToast("Logged in successfully.", "success");
      navigate(searchParams.get("redirect") || "/dashboard");
    } catch (error) {
      showToast(getErrorMessage(error, "Login failed."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      await signup(signupForm);
      showToast("Account created successfully.", "success");
      navigate(searchParams.get("redirect") || "/dashboard");
    } catch (error) {
      showToast(getErrorMessage(error, "Signup failed."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card glass-card reveal is-visible">
          <div className="auth-copy">
            <span className="eyebrow">Login / Signup</span>
            <h2>Welcome back to your note sharing workspace</h2>
            <p>
              Sign in to manage your notes, upload new resources, and continue building your study library.
            </p>
          </div>

          <div className="auth-panel">
            <div className="auth-switcher">
              <button
                type="button"
                className={`auth-tab${authMode === "login" ? " active" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab${authMode === "signup" ? " active" : ""}`}
                onClick={() => setAuthMode("signup")}
              >
                Signup
              </button>
            </div>

            <form className={`auth-form${authMode === "login" ? " active" : ""}`} onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="password-field">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="loginPassword"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label="Show password"
                    onMouseEnter={() => setShowLoginPassword(true)}
                    onMouseLeave={() => setShowLoginPassword(false)}
                    onFocus={() => setShowLoginPassword(true)}
                    onBlur={() => setShowLoginPassword(false)}
                  >
                    <i className={`fa-regular ${showLoginPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Login"}
              </button>
            </form>

            <form className={`auth-form${authMode === "signup" ? " active" : ""}`} onSubmit={handleSignupSubmit}>
              <div className="form-group">
                <label htmlFor="signupName">Full Name</label>
                <input
                  type="text"
                  id="signupName"
                  value={signupForm.name}
                  onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupEmail">Email</label>
                <input
                  type="email"
                  id="signupEmail"
                  value={signupForm.email}
                  onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signupPassword">Password</label>
                <div className="password-field">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    id="signupPassword"
                    value={signupForm.password}
                    onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label="Show password"
                    onMouseEnter={() => setShowSignupPassword(true)}
                    onMouseLeave={() => setShowSignupPassword(false)}
                    onFocus={() => setShowSignupPassword(true)}
                    onBlur={() => setShowSignupPassword(false)}
                  >
                    <i className={`fa-regular ${showSignupPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
