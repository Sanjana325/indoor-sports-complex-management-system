import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const emailOk = useMemo(() => isValidEmail(email), [email]);

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
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Request failed");
        return;
      }

      setMessage(data.message || "If that email exists, we sent a reset link.");
    } catch (err) {
      setError("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Forgot Password</h2>

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

        <p className="register-text">
          Back to <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}
