import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../components/useReveal";

export default function DashboardPage() {
  const { user } = useAuth();
  useReveal([]);

  return (
    <section className="section">
      <div className="container">
        <div className="split-layout">
          <div className="split-layout__intro reveal">
            <span className="eyebrow">Dashboard</span>
            <h2>Your study workspace</h2>
            <p>Jump back into notes, question papers, and your recent download activity.</p>

            <div className="info-stack">
              <article className="info-card glass-card">
                <i className="fa-solid fa-user-check"></i>
                <div>
                  <h3>{user?.name || "Your workspace"}</h3>
                  <p>Your account is ready for browsing, previewing, and downloading study material.</p>
                </div>
              </article>
            </div>
          </div>
        </div>

        <section className="section section--compact">
          <div className="section-heading reveal">
            <span className="eyebrow">Quick Access</span>
            <h2>Continue studying</h2>
          </div>

          <div className="module-grid">
            <article className="info-card glass-card reveal is-visible">
              <i className="fa-regular fa-note-sticky"></i>
              <div>
                <h3>Browse Notes</h3>
                <p>Search notes by title, subject, and course material.</p>
                <Link to="/explore" className="btn btn--secondary">Open Notes</Link>
              </div>
            </article>
            <article className="info-card glass-card reveal is-visible">
              <i className="fa-solid fa-folder-tree"></i>
              <div>
                <h3>Question Bank</h3>
                <p>Find exam papers by university, course, semester, and subject.</p>
                <Link to="/question-bank" className="btn btn--secondary">Open Papers</Link>
              </div>
            </article>
            <article className="info-card glass-card reveal is-visible">
              <i className="fa-regular fa-user"></i>
              <div>
                <h3>Profile Activity</h3>
                <p>View your account details and recent downloaded notes.</p>
                <Link to="/profile" className="btn btn--secondary">Open Profile</Link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
