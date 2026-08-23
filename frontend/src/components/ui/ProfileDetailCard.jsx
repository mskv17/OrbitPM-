import React from "react";

export const ProfileDetailCard = ({ label, value, children }) => {
  return (
    <div className="profile-detail-card">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || children}</span>
    </div>
  );
};

export default ProfileDetailCard;
