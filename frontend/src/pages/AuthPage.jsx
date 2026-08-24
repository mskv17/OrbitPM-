import { useState } from "react";
import { Form } from "../components/ui/Form";
import { FormMessage } from "../components/ui/FormMessage";
import { AuthCard } from "../components/ui/AuthCard";
import "./css/authPage.css";
import { validateLoginForm, validateSignUpForm } from "../utils/validators/fromValidator";
import { useMutation } from "@tanstack/react-query";
import { post } from "../services/api/api";
import { Link, useNavigate } from "react-router-dom";
import ButtonSpinner from "../components/ui/ButtonSpinner";

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
  const handleSwitch = () => {
    setIsSignUp((prv) => !prv);
  };

  const authMutation = useMutation({
    mutationFn: async ({ data, auth }) => {
      const res = await post(`/auth/${auth}`, data);
      return res;
    },
    onSuccess: (data) => {
      setMessage({ type: "success", text: data.message });
      localStorage.setItem("user", JSON.stringify(data.data.user));
      navigate("/dashboard");
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message || "An error occurred" });
    },
  });

  const handleSignUp = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    const formData = new FormData(e.target);
    const obj = Object.fromEntries(formData.entries());
    const { isValid, message } = validateSignUpForm(obj);
    if (!isValid) {
      return setMessage({ type: "error", text: message });
    }
    authMutation.mutate({ data: obj, auth: "register" });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    const formData = new FormData(e.target);
    const obj = Object.fromEntries(formData.entries());
    const { isValid, message } = validateLoginForm(obj);
    if (!isValid) {
      return setMessage({ type: "error", text: message });
    }
    authMutation.mutate({ data: obj, auth: "login" });
  };

  return (
    <AuthCard headline="Modern project management for agile teams.">
      {!isSignUp ? (
        <Form
          title="Login into your account"
          footerText="Don't have an account ?"
          footerAction="Sign Up"
          footerOnAction={handleSwitch}
          onSubmit={handleLogin}
        >
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />

          <div className="form-label-row">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>
          <input type="password" id="password" name="password" required />

          <FormMessage message={message} />

          <button disabled={!isSignUp && authMutation.isLoading}>
            {!isSignUp && authMutation.isLoading ? <ButtonSpinner label="Logging in..." /> : "Login"}
          </button>
        </Form>
      ) : (
        <Form
          title="Create your account"
          footerText="Already have an account ?"
          footerAction="Login"
          footerOnAction={handleSwitch}
          onSubmit={handleSignUp}
        >
          <label htmlFor="name">Name</label>
          <input type="text" required name="name" />
          <label htmlFor="email">Email</label>
          <input type="email" name="email" required />
          <label htmlFor="password">Password</label>
          <input type="password" name="password" required />
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" name="confirmPassword" required />

          <FormMessage message={message} />

          <button disabled={isSignUp && authMutation.isLoading}>
            {isSignUp && authMutation.isLoading ? <ButtonSpinner label="Creating account..." /> : "Sign Up"}
          </button>
        </Form>
      )}
    </AuthCard>
  );
};


