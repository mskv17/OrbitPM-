import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthMe } from "../hooks/AuthMe";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import ProfileDetailCard from "../components/ui/ProfileDetailCard";
import SecurityOptionCard from "../components/profile/SecurityOptionCard";
import PasswordAuthModal from "../components/profile/PasswordAuthModal";
import EditProfileModal from "../components/profile/EditProfileModal";
import "./css/profilePage.css";

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = AuthMe();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localOverrides, setLocalOverrides] = useState({});

  if (isLoading) {
    return <Spinner label="Fetching your user profile..." fullScreen={false} />;
  }

  if (isError || data?.success === false) {
    return (
      <div className="profile-container">
        <FormMessage
          type="error"
          text={error?.message || data?.message || "Failed to load profile details."}
        />
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button
            type="button"
            className="profile-btn profile-btn--primary"
            onClick={() => refetch()}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const fetchedUser = data?.data?.user || {};
  const user = { ...fetchedUser, ...localOverrides };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "N/A";

  const lastLoginFormatted = user.lastLoging
    ? new Date(user.lastLoging).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "Active Session";

  const handleSaveProfile = (updatedData) => {
    setLocalOverrides((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Banner */}
        <div className="profile-banner" />

        {/* Header Avatar & Action Buttons */}
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            {user.avathar ? (
              <img
                src={user.avathar}
                alt={user.name}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-initials">
                {getInitials(user.name)}
              </div>
            )}
          </div>

          <div className="profile-header-actions">
            <button
              type="button"
              className="profile-btn profile-btn--secondary profile-edit-icon-btn"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            <Link to="/dashboard" className="profile-btn profile-btn--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* User Identity Info */}
        <div className="profile-user-info">
          <h1 className="profile-user-name">{user.name || "User Profile"}</h1>
          <div className="profile-user-email">
            <span>{user.email}</span>
            <span
              className={`status-badge ${user.isVerified ? "verified" : "unverified"
                }`}
            >
              {user.isVerified ? "✓ Verified Account" : "⚠ Unverified"}
            </span>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="profile-details-grid">
          <ProfileDetailCard label="Member Since" value={formattedDate} />
          <ProfileDetailCard label="Last Login" value={lastLoginFormatted} />
        </div>

        {/* Security & Authentication Section */}
        <div className="profile-security-section">
          <h2 className="security-section-title">Security & Account Access</h2>
          <SecurityOptionCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            title="Password and authentication"
            description="Manage your sign-in methods and password options"
            buttonText="Manage"
            onClick={() => setIsAuthModalOpen(true)}
          />
        </div>
      </div>

      {/* Edit Profile Modal Popup */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      {/* Password & Authentication Modal Popup */}
      <PasswordAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;
