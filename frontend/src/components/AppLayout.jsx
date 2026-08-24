import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { PopupConform } from "./popup";
import "./style/layout.css";
import { post } from "../services/api/api";
import { useMutation } from "@tanstack/react-query";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/auth";
  const [user, setUser] = useState(getStoredUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setUser(getStoredUser());
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Close quick action menu and mobile nav on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsMobileNavOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const logout = useMutation({
    mutationFn: async () => {
      const res = await post("/auth/logout");
      return res;
    }
  });

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("user");
    logout.mutate();
    setUser(null);
    navigate("/auth");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        {/* Mobile Navigation Toggle Button */}
        <button
          type="button"
          className={`app-mobile-toggle ${isMobileNavOpen ? "is-active" : ""}`}
          onClick={() => setIsMobileNavOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileNavOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {isMobileNavOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <NavLink
          className="app-logo"
          to="/"
          aria-label="OrbitPM home"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <span className="app-logo-mark" aria-hidden="true">⬢</span>
          <span>OrbitPM</span>
        </NavLink>


        {/* Main Header Navigation */}
        <nav className={`app-navigation ${isMobileNavOpen ? "is-mobile-open" : ""}`} aria-label="Main navigation">
          {location.pathname === "/" && (
            <>
              <a
                href="#features"
                className="app-nav-link"
                onClick={() => setIsMobileNavOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="app-nav-link"
                onClick={() => setIsMobileNavOpen(false)}
              >
                Pricing
              </a>
            </>
          )}
          <NavLink
            className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            to="/dashboard"
            onClick={() => setIsMobileNavOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            to="/organizations"
            onClick={() => setIsMobileNavOpen(false)}
          >
            Organizations
          </NavLink>
        </nav>


        {user ? (
          <div className="app-user-container" ref={containerRef}>
            <button
              type="button"
              className={`app-user-card ${isMenuOpen ? "is-active" : ""}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              onFocus={() => setIsMenuOpen(true)}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              aria-label="User account menu"
            >
              {user.avathar ? (
                <img className="app-user-avatar" src={user.avathar} alt="" />
              ) : (
                <span className="app-user-initials" aria-hidden="true">
                  {getInitials(user.name)}
                </span>
              )}
              <span className="app-user-name">{user.name || "User"}</span>
              <svg
                className={`app-user-chevron ${isMenuOpen ? "is-open" : ""}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="app-user-menu" role="menu" aria-label="Quick actions">
                <div className="app-user-menu-header">
                  <div className="app-user-menu-name">{user.name || "User"}</div>
                  {user.email && <div className="app-user-menu-email">{user.email}</div>}
                </div>

                <button
                  type="button"
                  className="app-menu-item"
                  role="menuitem"
                  onClick={handleProfileClick}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="app-menu-item app-menu-item--danger"
                  role="menuitem"
                  onClick={handleLogoutClick}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavLink className="app-header-action" to={isAuthPage ? "/" : "/auth"}>
            {isAuthPage ? "Back home" : "Sign in"}
          </NavLink>
        )}
      </header>

      {showLogoutConfirm && (
        <PopupConform
          message="Are you sure you want to log out of your account?"
          onConfirmed={handleConfirmLogout}
          onDenied={() => setShowLogoutConfirm(false)}
        />
      )}

      <div className="app-content">{children}</div>
    </div>
  );
}
