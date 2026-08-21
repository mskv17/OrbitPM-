import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Form } from "../components/ui/Form";
import { FormMessage } from "../components/ui/FormMessage";
import { AuthCard } from "../components/ui/AuthCard";
import Spinner from "../components/Spinner";
import { post } from "../services/api/api";
import "./css/authPage.css";

const COOLDOWN_SECONDS = 5 * 60; // 5 minutes window
const STORAGE_KEY = "forgot_password_cooldown_timestamp";

function getInitialRemainingSeconds() {
  try {
    const savedTimestamp = localStorage.getItem(STORAGE_KEY);
    if (!savedTimestamp) return 0;
    const elapsedSeconds = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
    const remaining = COOLDOWN_SECONDS - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return 0;
  }
}

function formatMinutesSeconds(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [remainingTime, setRemainingTime] = useState(getInitialRemainingSeconds);
  const [message, setMessage] = useState(() => {
    const initialRemaining = getInitialRemainingSeconds();
    if (initialRemaining > 0) {
      return {
        type: "info",
        text: `Reset link was sent. You can request another link in ${formatMinutesSeconds(initialRemaining)}.`,
      };
    }
    return { type: "", text: "" };
  });

  // Countdown timer effect
  useEffect(() => {
    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(STORAGE_KEY);
          clearInterval(interval);
          setMessage((current) =>
            current.type === "info" ? { type: "", text: "" } : current
          );
          return 0;
        }
        const nextTime = prev - 1;
        setMessage((current) => {
          if (current.type === "info" || current.type === "success") {
            return {
              type: "info",
              text: `Reset link sent. You can request another link in ${formatMinutesSeconds(nextTime)}.`,
            };
          }
          return current;
        });
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      const res = await post("/auth/forgot-password", { email });
      return res;
    },
    onSuccess: (data) => {
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, now.toString());
      setRemainingTime(COOLDOWN_SECONDS);
      setMessage({
        type: "success",
        text:
          data?.message ||
          `Password reset link sent! You can request a new link in ${formatMinutesSeconds(COOLDOWN_SECONDS)}.`,
      });
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error?.message || "Failed to send reset link. Please check your email and try again.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (remainingTime > 0) {
      return setMessage({
        type: "info",
        text: `Please wait ${formatMinutesSeconds(remainingTime)} before requesting another reset link.`,
      });
    }

    setMessage({ type: "", text: "" });
    const formData = new FormData(e.target);
    const email = formData.get("email")?.trim();

    if (!email) {
      return setMessage({ type: "error", text: "Please enter your email address." });
    }

    forgotPasswordMutation.mutate(email);
  };

  return (
    <AuthCard headline="Recover your account access quickly and securely.">
      <Form
        title="Reset your password"
        footerText="Remembered your password?"
        footerAction="Back to Login"
        footerOnAction={() => navigate("/auth")}
        onSubmit={handleSubmit}
      >
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="enter your registered email"
          required
        />

        <FormMessage message={message} />

        <button disabled={forgotPasswordMutation.isPending || remainingTime > 0}>
          {forgotPasswordMutation.isPending ? (
            <Spinner label="Sending link..." />
          ) : remainingTime > 0 ? (
            `Resend in ${formatMinutesSeconds(remainingTime)}`
          ) : (
            "Send Reset Link"
          )}
        </button>
      </Form>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
