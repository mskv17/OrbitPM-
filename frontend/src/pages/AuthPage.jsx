import { useState } from "react";
import { Form } from "../components/ui/Form";
import "./css/authPage.css";
import { validateLoginForm, validateSignUpForm } from "../utils/validators/fromValidator";
import { useMutation } from "@tanstack/react-query";
import { post } from "../services/api/api";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
  const handleSwitch = () => {
    setIsSignUp((prv) => !prv);
  };

  const authMutation = useMutation({
    mutationFn: async ({data,auth}) => {
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
    <div className="container w-100 vh-100 d-flex justify-content-center align-items-center">
      <div className="auth-card">
        <div className="brand-section">
          <header>
            <h1>OrbitPM</h1>
            <p>Plan. Track. Deliver.</p>
          </header>
          <main>
            <h2>Modern project management for agile teams.</h2>
          </main>
        </div>
        <div className="auth-section">
          {!isSignUp ? (
            <Form
              title="Login into your account"
              footerText="Don't have an account ?"
              footerAction="Sign Up"
              footerOnAction={handleSwitch}
              onSubmit={handleLogin}
            >
              <label htmlFor="email">Email</label>
              <input type="email" name="email" required />
              <label htmlFor="password">Password</label>
              <input type="password" name="password" required />
              {message?.text && (
                <p
                  className={`form-message ${message.type || "info"}`}
                  role="alert"
                >
                  {message.text}
                </p>
              )}
              <button disabled={!isSignUp && authMutation.isLoading}>
                {!isSignUp && authMutation.isLoading ? <Spinner label="Logging in..." /> : "Login"}
              </button>
            </Form>
          ) : (
            <Form
              title="Create your account"
              footerText="Already have an account ?"
              footerAction="Login"
              footerOnAction={handleSwitch}
              onSubmit={handleSignUp}
              message={message}
            >
              <label htmlFor="name">Name</label>
              <input type="text" required name="name" />
              <label htmlFor="email">Email</label>
              <input type="email" name="email" required />
              <label htmlFor="password">Password</label>
              <input type="password" name="password" required />
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" name="confirmPassword" required />
              {message?.text && (
                <p
                  className={`form-message ${message.type || "info"}`}
                  role="alert"
                >
                  {message.text}
                </p>
              )}
              <button disabled={isSignUp && authMutation.isLoading}>
                {isSignUp && authMutation.isLoading ? <Spinner label="Creating account..." /> : "Sign Up"}
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};
