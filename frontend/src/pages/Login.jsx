import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { profileRouteForRole, homeRouteForRole } from "../utils/navigation";
import "../styles/Login.css";

// clean up email text to remove spaces and make it lowercase
function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

// verify that the email address is correctly formatted
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

// the main login page for all system users
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  // check if user input is valid before sending request
  function validateForm() {
    const errs = {};

    if (!normalizedEmail) errs.email = "Email is required";
    else if (!isValidEmail(normalizedEmail)) errs.email = "Enter a valid email address";

    if (!password) errs.password = "Password is required";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // send login request to the backend server
  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const ok = validateForm();
    if (!ok) return;

    setLoading(true);

    try {
      const user = await login(normalizedEmail, password);

      // force password change if the user has a temporary password
      if (user.mustChangePassword) {
        navigate(profileRouteForRole(user.role));
        return;
      }

      // redirect to the correct dashboard based on user role
      navigate(homeRouteForRole(user.role));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  // helper function to get error text for a specific input field
  function fieldErrorText(key) {
    return fieldErrors && fieldErrors[key] ? fieldErrors[key] : "";
  }

  return (
    <div className="login-container">
      {/* login form card with branding and credentials input */}
      <form className="login-card" onSubmit={handleLogin}>
        <div className="title-container">
          <h2 className="brand-title">Arena<span>Pro</span></h2>
          <h3 className="action-title">Sign In</h3>
        </div>

        {/* show global error messages at the top */}
        {error ? <div className="login-error">{error}</div> : null}

        <label>Email</label>
        <input
          type="email"
          placeholder="e.g. nuwan.perera@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {/* individual field error for the email input */}
        {fieldErrorText("email") ? <div className="login-error-inline">{fieldErrorText("email")}</div> : null}

        <label>Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="password-input"
          />
          {/* button to reveal/hide password text */}
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
          </button>
        </div>
        {/* individual field error for the password input */}
        {fieldErrorText("password") ? <div className="login-error-inline">{fieldErrorText("password")}</div> : null}

        {/* link to password recovery flow */}
        <div className="forgot-password-container">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {/* quick link for new players to register */}
        <p className="register-text">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>
      </form>
    </div>
  );
}
