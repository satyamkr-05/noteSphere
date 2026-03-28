import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children, isDark, onLogout, onToggleTheme, showToast }) {
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const desktopProfileMenuRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.body.classList.toggle("menu-open", navOpen);
  }, [navOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const isInsideDesktopMenu = desktopProfileMenuRef.current?.contains(event.target);
      const isInsideMobileMenu = mobileProfileMenuRef.current?.contains(event.target);

      if (!isInsideDesktopMenu && !isInsideMobileMenu) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function closeNav() {
    setNavOpen(false);
    setProfileMenuOpen(false);
  }

  function renderProfileMenu({ mobile = false } = {}) {
    const menuClassName = `profile-menu ${mobile ? "profile-menu--mobile" : "profile-menu--desktop"}${profileMenuOpen ? " is-open" : ""}`;

    return (
      <div
        className={menuClassName}
        ref={mobile ? mobileProfileMenuRef : desktopProfileMenuRef}
      >
        <button
          type="button"
          className="profile-trigger"
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
          onClick={() => setProfileMenuOpen((current) => !current)}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="profile-trigger__avatar" />
          ) : (
            <span className="profile-trigger__avatar profile-trigger__avatar--fallback">
              {getInitials(user?.name)}
            </span>
          )}
          <span className="profile-trigger__copy">
            <strong>{user?.name || "Profile"}</strong>
            <small>{user?.email}</small>
          </span>
          <i className={`profile-trigger__chevron fa-solid ${profileMenuOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
        </button>

        <div className="profile-dropdown glass-card" role="menu">
          <NavLink to="/profile" className="profile-dropdown__link" onClick={closeNav}>
            <i className="fa-regular fa-user"></i>
            <span>My Profile</span>
          </NavLink>
          <NavLink to="/dashboard" className="profile-dropdown__link" onClick={closeNav}>
            <i className="fa-regular fa-note-sticky"></i>
            <span>My Dashboard</span>
          </NavLink>
          <button
            type="button"
            className="profile-dropdown__link"
            onClick={() => {
              onLogout();
              closeNav();
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <nav className="navbar container" aria-label="Primary">
          <NavLink to="/" className="logo" aria-label="NoteSphere Home" onClick={closeNav}>
            <span className="logo__text">
              <span className="logo__text-note">Note</span>
              <span className="logo__text-sphere">Sphere</span>
            </span>
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

          <div className="mobile-header-right">
            {isAuthenticated ? (
              renderProfileMenu({ mobile: true })
            ) : (
              <NavLink to="/auth" className="mobile-header-login" onClick={closeNav}>
                Login
              </NavLink>
            )}
          </div>

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
            {isAuthenticated ? renderProfileMenu() : null}
          </div>
        </nav>

        <NavLink
          to="/"
          className="floating-home-button nav-action-button"
          aria-label="Go to home"
          onClick={closeNav}
        >
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
        </NavLink>

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
          <div className="footer-main">
            <div>
              <NavLink to="/" className="logo logo--footer">
                <span className="logo__text">
                  <span className="logo__text-note">Note</span>
                  <span className="logo__text-sphere">Sphere</span>
                </span>
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

          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} NoteSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NS";
}
