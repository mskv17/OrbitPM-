import React from "react";
import "./css/securityOptionCard.css";

export const SecurityOptionCard = ({
  icon,
  title,
  description,
  buttonText = "Manage",
  onClick,
}) => {
  return (
    <div className="profile-security-card" onClick={onClick}>
      <div className="security-card-left">
        <div className="security-card-icon">{icon}</div>
        <div>
          <h3 className="security-card-name">{title}</h3>
          <p className="security-card-desc">{description}</p>
        </div>
      </div>
      <button
        type="button"
        className="profile-btn profile-btn--secondary"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default SecurityOptionCard;
