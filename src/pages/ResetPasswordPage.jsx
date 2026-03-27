import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";

export default function ResetPasswordPage({ showToast }) {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await api.post(`/auth/reset-password/${token}`, form);
      setIsComplete(true);
      showToast(response.data.message || "Password reset successful.", "success");
      window.setTimeout(() => navigate("/auth"), 1800);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to reset password."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card glass-card reveal is-visible">
          <div className="auth-copy">
            <span className="eyebrow">Set New Password</span>
            <h2>Create a new password for your account</h2>
            <p>
              Choose a strong password with at least 6 characters. Once saved, you can log back in immediately.
            </p>
          </div>

          <div className="auth-panel">
            {token ? (
              <form className="auth-form active" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="resetPassword">New Password</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="resetPassword"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      minLength={6}
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={form.confirmPassword}
                      onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label="Show password confirmation"
                      onMouseEnter={() => setShowConfirmPassword(true)}
                      onMouseLeave={() => setShowConfirmPassword(false)}
                      onFocus={() => setShowConfirmPassword(true)}
                      onBlur={() => setShowConfirmPassword(false)}
                    >
                      <i className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting || isComplete}>
                  {isSubmitting ? "Updating password..." : isComplete ? "Password Updated" : "Reset Password"}
                </button>

                <Link to="/auth" className="text-link auth-form__helper-link">
                  Back to login
                </Link>
              </form>
            ) : (
              <div className="auth-feedback">
                <strong>This password reset link is missing or incomplete.</strong>
                <p>Please request a new password reset email and try again.</p>
                <Link to="/forgot-password" className="text-link auth-form__helper-link">
                  Request a new link
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
