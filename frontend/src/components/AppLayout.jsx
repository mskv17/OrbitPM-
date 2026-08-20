import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./style/layout.css";

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
  const isAuthPage = location.pathname === "/auth";
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="app-logo" to="/" aria-label="OrbitPM home">
          <span className="app-logo-mark" aria-hidden="true">⬢</span>
          <span>OrbitPM</span>
        </NavLink>

        <nav className="app-navigation" aria-label="Main navigation">
          {/* <NavLink
            className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            to="/"
          >
            Home
          </NavLink> */}
          <NavLink
            className={({ isActive }) => `app-nav-link${isActive ? " is-active" : ""}`}
            to="/dashboard"
          >
            Dashboard
          </NavLink>
        </nav>

        {user ? (
          <NavLink className="app-user-card" to="/dashboard" aria-label="Open your dashboard">
            {user.avathar ? (
              <img className="app-user-avatar" src={user.avathar} alt="" />
            ) : (
              <span className="app-user-initials" aria-hidden="true">
                {getInitials(user.name)}
              </span>
            )}
            <span className="app-user-name">{user.name || "User"}</span>
          </NavLink>
        ) : (
          <NavLink className="app-header-action" to={isAuthPage ? "/" : "/auth"}>
            {isAuthPage ? "Back home" : "Sign in"}
          </NavLink>
        )}
      </header>
      <div className="app-content">{children}</div>
    </div>
  );
}
