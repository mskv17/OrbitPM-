import React from "react";
import "../style/spinner.css";

export function ButtonSpinner({ label = "Loading...", className = "" }) {
  return (
    <span className={`button-spinner-container ${className}`} role="status">
      <span className="button-spinner-ring" aria-hidden="true" />
      {label && <span className="button-spinner-label">{label}</span>}
    </span>
  );
}

export default ButtonSpinner;
