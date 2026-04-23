import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isStrongPassword, passwordPolicyMessage } from "../utils/validation";
import authService from "../services/authService";
import "../styles/Login.css";

// helper to read URL parameters (like the reset token)
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// page where users set a new password after receiving a reset link
export default function ResetPassword() {
  const navigate = useNavigate();
  const q = useQuery();
  const token = q.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // logic to enable/disable the submit button based on validation
  const canSubmit = useMemo(() => {
    if (!token) return false;
    if (!isStrongPassword(newPassword)) return false;
    if (newPassword !== confirm) return false;
    return true;
  }, [token, newPassword, confirm]);

  // process the password change request
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword(token, newPassword);
      setMessage(data.message || "Password reset successful.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* secure form for finalizing the password recovery process */}
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="title-container">
          <h2 className="brand-title">Arena<span>Pro</span></h2>
          <h3 className="action-title">Reset Password</h3>
        </div>

        {/* global alert messages for feedback */}
        {error ? <div className="login-error">{error}</div> : null}
        {message ? <div className="login-success">{message}</div> : null}

        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        {/* help text to guide the user on security rules */}
        <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>{passwordPolicyMessage()}</div>

        <label style={{ marginTop: 12 }}>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />

        <button type="submit" className="login-btn" disabled={loading || !canSubmit}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        {/* link back to authentication gateway */}
        <p className="register-text">
          Back to <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
