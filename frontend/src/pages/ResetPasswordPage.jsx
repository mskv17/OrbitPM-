import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "../components/ui/Form";
import { FormMessage } from "../components/ui/FormMessage";
import { AuthCard } from "../components/ui/AuthCard";
import Spinner from "../components/Spinner";
import { post } from "../services/api/api";
import "./css/authPage.css";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Verify token validity on page load
  const verifyTokenMutation = useMutation({
    mutationFn: async (resetToken) => {
      const res = await post("/auth/verify-reset-token", { token: resetToken });
      return res;
    },
    onSuccess: () => {
      setIsVerifyingToken(false);
      setTokenError("");
    },
    onError: (error) => {
      setIsVerifyingToken(false);
      setTokenError(error?.message || "Invalid or expired password reset link.");
    },
  });

  useEffect(() => {
    if (!token) {
      setIsVerifyingToken(false);
      setTokenError("Missing reset token. Please use the reset link sent to your email.");
      return;
    }

    setIsVerifyingToken(true);
    verifyTokenMutation.mutate(token);
  }, [token]);

  // 2. Submit new password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }) => {
      const res = await post("/auth/reset-password", { token, password });
      return res;
    },
    onSuccess: (data) => {
      setMessage({ type: "success", text: data?.message || "Password updated successfully!" });
      if (data?.data?.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error?.message || "Failed to reset password. Please try again.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const formData = new FormData(e.target);
    const password = formData.get("password")?.trim();
    const confirmPassword = formData.get("confirmPassword")?.trim();

    if (!password || !confirmPassword) {
      return setMessage({ type: "error", text: "Please fill in all password fields." });
    }

    if (password.length < 8) {
      return setMessage({
        type: "error",
        text: "Password requires a minimum of 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }

    resetPasswordMutation.mutate({ token, password });
  };

  return (
    <AuthCard headline="Set a new password for your OrbitPM account.">
      {isVerifyingToken ? (
        <div className="d-flex flex-column align-items-center justify-content-center p-4">
          <Spinner label="Verifying your reset link..." />
        </div>
      ) : tokenError ? (
        <div className="text-center user-select-none p-3">
          <h1 className="text-center display-6 w-100 mb-3">Invalid Link</h1>
          <FormMessage type="error" text={tokenError} />
          <div className="mt-4">
            <Link to="/forgot-password" className="forgot-password-link">
              Request a new reset link
            </Link>
          </div>
        </div>
      ) : (
        <Form
          title="Set new password"
          footerText="Remembered your password?"
          footerAction="Back to Login"
          footerOnAction={() => navigate("/auth")}
          onSubmit={handleSubmit}
        >
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="At least 8 characters"
            required
            disabled={resetPasswordMutation.isPending}
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter new password"
            required
            disabled={resetPasswordMutation.isPending}
          />

          <FormMessage message={message} />

          <button disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? (
              <Spinner label="Updating password..." />
            ) : (
              "Reset Password"
            )}
          </button>
        </Form>
      )}
    </AuthCard>
  );
};

export default ResetPasswordPage;

