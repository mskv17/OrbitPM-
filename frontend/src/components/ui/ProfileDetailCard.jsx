import React from "react";

export const ProfileDetailCard = ({ label, value, icon, onClick, children }) => {
  return (
    <div
      className={`profile-detail-card ${onClick ? "is-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="detail-header" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && (
          <span className="detail-icon" style={{ display: "inline-flex", color: "var(--primary, #2563eb)" }}>
            {icon}
          </span>
        )}
        <span className="detail-label">{label}</span>
      </div>
      <span className="detail-value">{value ?? children}</span>
    </div>
  );
};

export default ProfileDetailCard;
