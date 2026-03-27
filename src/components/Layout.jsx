import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children, isDark, onLogout, onToggleTheme, showToast }) {
  const [navOpen, setNavOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.body.classList.toggle("menu-open", navOpen);
  }, [navOpen]);

  function closeNav() {
    setNavOpen(false);
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <nav className="navbar container" aria-label="Primary">
          <NavLink to="/" className="logo" aria-label="NoteSphere Home" onClick={closeNav}>
            <span className="logo__mark"><i className="fa-solid fa-note-sticky"></i></span>
            <span className="logo__text">NoteSphere</span>
          </NavLink>

          <button
            type="button"
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="navMenu"
            onClick={() => setNavOpen((current) => !current)}
          >
            <i className={`fa-solid ${navOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>

          <div className={`nav-menu${navOpen ? " is-open" : ""}`} id="navMenu">
            <NavLink to="/" onClick={closeNav}>Home</NavLink>
            <NavLink to="/upload" onClick={closeNav}>Upload Notes</NavLink>
            <NavLink to="/explore" onClick={closeNav}>Explore</NavLink>
            {user?.isAdmin ? <NavLink to="/admin" onClick={closeNav}>Admin</NavLink> : null}
            <NavLink to={isAuthenticated ? "/dashboard" : "/auth"} onClick={closeNav}>
              {isAuthenticated ? "Dashboard" : "Login"}
            </NavLink>
            <button
              type="button"
              className="nav-action-button nav-theme-toggle nav-theme-toggle--mobile"
              aria-label="Toggle dark mode"
              onClick={() => {
                onToggleTheme();
                showToast(isDark ? "Light mode enabled" : "Dark mode enabled", "info");
              }}
            >
              <i className={`fa-solid ${isDark ? "fa-sun" : "fa-moon"}`}></i>
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
            {isAuthenticated ? (
              <button type="button" className="nav-action-button" onClick={() => { onLogout(); closeNav(); }}>
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>{user?.name || "Logout"}</span>
              </button>
            ) : null}
          </div>
        </nav>

        <button
          type="button"
          className="floating-theme-toggle nav-action-button nav-theme-toggle nav-theme-toggle--desktop"
          aria-label="Toggle dark mode"
          onClick={() => {
            onToggleTheme();
            showToast(isDark ? "Light mode enabled" : "Dark mode enabled", "info");
          }}
        >
          <i className={`fa-solid ${isDark ? "fa-sun" : "fa-moon"}`}></i>
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-content">
          <div>
            <NavLink to="/" className="logo logo--footer">
              <span className="logo__mark"><i className="fa-solid fa-note-sticky"></i></span>
              <span className="logo__text">NoteSphere</span>
            </NavLink>
            <p>A modern note sharing experience for focused learners.</p>
          </div>

          <div className="footer-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/upload">Upload</NavLink>
            <NavLink to="/explore">Explore</NavLink>
            {user?.isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
            <NavLink to={isAuthenticated ? "/dashboard" : "/auth"}>
              {isAuthenticated ? "Dashboard" : "Login"}
            </NavLink>
          </div>

          <div className="social-links" aria-label="Social links">
            <a href="#" aria-label="Twitter"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
            <a href="#" aria-label="GitHub"><i className="fa-brands fa-github"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
