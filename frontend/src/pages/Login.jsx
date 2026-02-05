import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

function profileRouteForRole(role) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/profile";
  if (role === "STAFF") return "/staff/profile";
  if (role === "COACH") return "/coach/profile";
  if (role === "PLAYER") return "/player/profile";
  return "/profile";
}

function homeRouteForRole(role) {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "STAFF") return "/staff";
  if (role === "COACH") return "/coach";
  if (role === "PLAYER") return "/player";
  return "/";
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  function validateForm() {
    const errs = {};

    if (!normalizedEmail) errs.email = "Email is required";
    else if (!isValidEmail(normalizedEmail)) errs.email = "Enter a valid email address";

    if (!password) errs.password = "Password is required";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const ok = validateForm();
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
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
      localStorage.setItem("email", user.email || normalizedEmail);
      localStorage.setItem("role", user.role);
      localStorage.setItem("mustChangePassword", mustChangePassword ? "true" : "false");

      if (mustChangePassword) {
        navigate(profileRouteForRole(user.role));
        return;
      }

      navigate(homeRouteForRole(user.role));
    } catch (err) {
      setError("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  function fieldErrorText(key) {
    return fieldErrors && fieldErrors[key] ? fieldErrors[key] : "";
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
        {fieldErrorText("email") ? <div className="login-error-inline">{fieldErrorText("email")}</div> : null}

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {fieldErrorText("password") ? <div className="login-error-inline">{fieldErrorText("password")}</div> : null}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button type="button" className="secondary-btn" onClick={() => navigate("/forgot-password")}>
          Forgot Password
        </button>

        <p className="register-text">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
