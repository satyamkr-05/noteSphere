import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";

export default function ForgotPasswordPage({ showToast }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await api.post("/auth/forgot-password", { email });
      setFeedback(response.data);
      showToast(response.data.message || "Password reset email sent.", "success");
    } catch (error) {
      setFeedback(null);
      showToast(getErrorMessage(error, "Unable to send password reset email."), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card glass-card reveal is-visible">
          <div className="auth-copy">
            <span className="eyebrow">Password Help</span>
            <h2>Reset your password with a secure link</h2>
            <p>
              Enter the email address linked to your NoteSphere account and we will send you a reset link.
            </p>
          </div>

          <div className="auth-panel">
            <form className="auth-form active" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="forgotEmail">Email</label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
                {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
              </button>

              <Link to="/auth" className="text-link auth-form__helper-link">
                Back to login
              </Link>

              {feedback ? (
                <div className="auth-feedback">
                  <strong>{feedback.message}</strong>
                  {feedback.resetUrl ? (
                    <p>
                      Local testing link: <code>{feedback.resetUrl}</code>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
