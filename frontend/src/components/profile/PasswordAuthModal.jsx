import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "../ui/Modal";
import { FormMessage } from "../ui/FormMessage";
import Spinner from "../Spinner";
import { post } from "../../services/api/api";
import "./css/passwordAuthModal.css";

export const PasswordAuthModal = ({ isOpen, onClose }) => {
  const [modalView, setModalView] = useState("methods"); // "methods" | "changePassword"
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return res;
    },
    onSuccess: (responseData) => {
      setFeedback({
        type: "success",
        text: responseData?.message || "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setModalView("methods");
        setFeedback({ type: "", text: "" });
      }, 1500);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text:
          err?.message ||
          "Failed to change password. Please check your current password.",
      });
    },
  });

  const handleClose = () => {
    setModalView("methods");
    setFeedback({ type: "", text: "" });
    setCurrentPassword("");
    setNewPassword("");
    onClose();
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!currentPassword || !newPassword) {
      setFeedback({
        type: "error",
        text: "Please enter both your current password and new password.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalView === "methods" ? "Sign-in Methods" : "Change Password"}
      onBack={
        modalView === "changePassword"
          ? () => {
              setModalView("methods");
              setFeedback({ type: "", text: "" });
            }
          : undefined
      }
    >
      {modalView === "methods" ? (
        <div className="signin-methods-list">
          <div className="signin-method-item">
            <div className="method-info">
              <div className="method-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h4 className="method-name">Password</h4>
                <p className="method-desc">
                  Sign in with your email and password
                </p>
              </div>
            </div>
            <button
              type="button"
              className="profile-btn profile-btn--primary"
              onClick={() => setModalView("changePassword")}
            >
              Change password
            </button>
          </div>
        </div>
      ) : (
        <form
          className="change-password-form"
          onSubmit={handleChangePasswordSubmit}
        >
          {feedback.text && (
            <FormMessage type={feedback.type} text={feedback.text} />
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              disabled={changePasswordMutation.isPending}
              className="profile-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 8 characters)"
              required
              disabled={changePasswordMutation.isPending}
              className="profile-input"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="profile-btn profile-btn--secondary"
              onClick={() => {
                setModalView("methods");
                setFeedback({ type: "", text: "" });
              }}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-btn profile-btn--primary"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <Spinner label="Updating..." />
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PasswordAuthModal;
