import React from "react";
import "../style/popups.css";
import "../style/modal.css";

export const Modal = ({
  isOpen,
  onClose,
  title,
  onBack,
  children,
  maxWidth = "480px",
}) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="profile-modal-card"
        style={{ width: `min(100%, ${maxWidth})` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          {onBack && (
            <button
              type="button"
              className="modal-back-btn"
              onClick={onBack}
              aria-label="Back"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
