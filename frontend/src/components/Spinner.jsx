import React from "react";
import "./style/spinner.css";

export default function Spinner({ label = "Loading", fullScreen = false }) {
	return (
		<div
			className={`spinner-container${fullScreen ? " spinner-container--fullscreen" : ""}`}
			role="status"
			aria-label={label}
		>
			<span className="orbit-spinner" aria-hidden="true">
				<span />
			</span>
			{label && <span className="spinner-label">{label}</span>}
		</div>
	);
}
