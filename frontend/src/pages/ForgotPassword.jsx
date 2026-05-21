import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isValidEmail } from "../utils/validation";
import authService from "../services/authService";
import "../styles/Login.css";

// page for users who forgot their login credentials
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // auto-recalculate if email is valid for the button state
  const emailOk = useMemo(() => isValidEmail(email), [email]);

  // handle the reset request submission
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.forgotPassword(cleanEmail);
      setMessage(data.message || "If that email exists, we sent a reset link.");
    } catch (err) {
      setError(err.response?.data?.message || "Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* card layout for requesting a password recovery link */}
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="title-container">
          <h2 className="brand-title">Arena<span>Pro</span></h2>
          <h3 className="action-title">Forgot Password</h3>
        </div>

        {/* show errors or success messages at the top */}
        {error ? <div className="login-error">{error}</div> : null}
        {message ? <div className="login-success">{message}</div> : null}

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <button type="submit" className="login-btn" disabled={loading || !emailOk}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* navigate back to the main sign-in landing */}
        <p className="register-text">
          Back to <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
