import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { post } from "../services/api/api";
import "./css/verifyEmail.css";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const verifyMutation = useMutation({
    mutationFn: (verificationToken) =>
      post("/auth/verify-email", { token: verificationToken }),
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  const isSuccess = verifyMutation.isSuccess;
  const message = isSuccess
    ? verifyMutation.data?.message
    : verifyMutation.error?.message;

  return (
    <main className="verify-email-page">
      <section className="verify-email-card" aria-live="polite">
        <div className={`verify-email-icon${isSuccess ? " is-success" : ""}`} aria-hidden="true">
          {isSuccess ? "✓" : "@"}
        </div>
        <p className="verify-email-eyebrow">OrbitPM account verification</p>
        <h1>{isSuccess ? "Email verified" : "Verify your email"}</h1>

        {!token && (
          <p className="verify-email-message error">
            Verification token is missing. Please use the link from your email.
          </p>
        )}

        {verifyMutation.isPending && (
          <Spinner label="Verifying your email..." />
        )}

        {message && !verifyMutation.isPending && (
          <p className={`verify-email-message ${isSuccess ? "success" : "error"}`}>
            {message}
          </p>
        )}

        {isSuccess && (
          <Link className="verify-email-action" to="/dashboard">
            Go to your dashboard
          </Link>
        )}
      </section>
    </main>
  );
}
