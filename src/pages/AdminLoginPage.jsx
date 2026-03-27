import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";
import { getErrorMessage } from "../services/api";

export default function AdminLoginPage({ showToast }) {
  const { isAuthenticated, isAuthLoading, user, loginAdmin, logout } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useReveal([]);

  if (isAuthLoading) {
    return <div className="page-status glass-card">Checking admin access...</div>;
  }

  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to={searchParams.get("redirect") || "/admin"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await loginAdmin(form);
      showToast("Admin access granted.", "success");
      navigate(searchParams.get("redirect") || "/admin");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to sign in to the admin panel."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card glass-card reveal is-visible">
          <div className="auth-copy">
            <span className="eyebrow">Admin Access</span>
            <h2>Secure administration for NoteSphere</h2>
            <p>
              Sign in with the configured administrator account to review notes, manage users,
              and keep the platform organized.
            </p>

            {isAuthenticated && !user?.isAdmin ? (
              <div className="admin-info-card glass-card">
                <h3>You are signed in as a regular user</h3>
                <p>Log out first, then continue with the reserved administrator account.</p>
                <button type="button" className="btn btn--secondary" onClick={logout}>
                  Log Out
                </button>
              </div>
            ) : null}
          </div>

          <div className="auth-panel">
            <form className="auth-form active" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="adminEmail">Admin Email</label>
                <input
                  type="email"
                  id="adminEmail"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminPassword">Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="adminPassword"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label="Show password"
                    onMouseEnter={() => setShowPassword(true)}
                    onMouseLeave={() => setShowPassword(false)}
                    onFocus={() => setShowPassword(true)}
                    onBlur={() => setShowPassword(false)}
                  >
                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                {isSubmitting ? "Checking access..." : "Open Admin Panel"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
