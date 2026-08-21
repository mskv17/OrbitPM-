import React from "react";
import "./style/popups.css";

export const PopupConform = ({ message, onConfirmed, onDenied }) => {
  return (
    <div className="popup-overlay" onClick={onDenied}>
      <div
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-describedby="popup-message"
      >
        <div className="popup-icon" aria-hidden="true">?</div>
        <p className="popup-eyebrow">Confirm action</p>
        <p id="popup-message" className="popup-message">{message}</p>
        <div className="popup-actions">
          <button className="popup-btn popup-btn--secondary" type="button" onClick={onDenied}>
            Cancel
          </button>
          <button className="popup-btn popup-btn--primary" type="button" onClick={onConfirmed}>
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};


