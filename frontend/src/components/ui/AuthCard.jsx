import React from "react";
import "../../pages/css/authPage.css";

export const AuthContainer = ({ children, className = "" }) => {
  return (
    <div className={`container w-100 vh-100 d-flex justify-content-center align-items-center ${className}`}>
      {children}
    </div>
  );
};

export const AuthCard = ({
  headline = "Modern project management for agile teams.",
  subtitle = "Plan. Track. Deliver.",
  brandName = "OrbitPM",
  children,
}) => {
  return (
    <AuthContainer>
      <div className="auth-card">
        <div className="brand-section">
          <header>
            <h1>{brandName}</h1>
            <p>{subtitle}</p>
          </header>
          <main>
            <h2>{headline}</h2>
          </main>
        </div>
        <div className="auth-section">{children}</div>
      </div>
    </AuthContainer>
  );
};

export default AuthCard;
