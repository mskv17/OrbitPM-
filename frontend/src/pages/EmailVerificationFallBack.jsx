import "./css/emailVerification.css";

export const EmailVerificationFallBack = ({ email }) => {
  return (
    <main className="verification-page">
      <section className="verification-card" aria-labelledby="verification-title">
        <div className="verification-icon" aria-hidden="true">@</div>
        <p className="verification-eyebrow">OrbitPM account setup</p>
        <h1 id="verification-title">Check your inbox</h1>
        <p className="verification-message">
          We sent a verification email to <strong>{email || "your email address"}</strong>. Please check
          your inbox and follow the link to continue.
        </p>
        <button
          className="verification-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          I have verified my email
        </button>
        <p className="verification-help">
          Already finished? Click the button above to refresh your session.
        </p>
      </section>
    </main>
  );
};
