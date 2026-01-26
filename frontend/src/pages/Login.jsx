import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("ADMIN");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const token = data.token;
      const user = data.user;
      const mustChangePassword = Boolean(data.mustChangePassword);

      if (!token || !user || !user.role) {
        setError("Invalid response from server");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userId", String(user.userId || ""));
      localStorage.setItem("firstName", user.firstName || "");
      localStorage.setItem("lastName", user.lastName || "");
      localStorage.setItem("email", user.email || email);
      localStorage.setItem("role", user.role);
      localStorage.setItem("mustChangePassword", mustChangePassword ? "true" : "false");

      if (mustChangePassword) {
        if (user.role === "ADMIN") navigate("/admin/profile");
        else if (user.role === "STAFF") navigate("/staff/profile");
        else if (user.role === "COACH") navigate("/coach/profile");
        else if (user.role === "PLAYER") navigate("/player/profile");
        else navigate("/profile");
        return;
      }

      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "STAFF") navigate("/staff");
      else if (user.role === "COACH") navigate("/coach");
      else if (user.role === "PLAYER") navigate("/player");
      else navigate("/");
    } catch (err) {
      setError("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2 className="login-title">Login Page</h2>

        {error ? <div className="login-error">{error}</div> : null}

        <label>Email</label>
        <input
          type="email"
          placeholder="e.g. nuwan.perera@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="role-box">
          <label>Select Role to Login As</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="COACH">Coach</option>
            <option value="PLAYER">Player</option>
          </select>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button type="button" className="secondary-btn">
          Forgot Password
        </button>

        <p className="register-text">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
