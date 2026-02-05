import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";

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

function isStrongPassword(pw) {
  if (typeof pw !== "string") return false;
  if (pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

function passwordPolicyMessage() {
  return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
}

function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/\s+/g, "").trim();
}

function isValidPhoneNumber(phone) {
  const p = normalizePhone(phone);

  if (!p) return false;

  if (/^\+94\d{9}$/.test(p)) return true;
  if (/^94\d{9}$/.test(p)) return true;
  if (/^0\d{9}$/.test(p)) return true;
  if (/^\d{9,12}$/.test(p)) return true;

  return false;
}

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const normalizedPhone = useMemo(() => normalizePhone(phoneNumber), [phoneNumber]);

  function validateForm() {
    const errs = {};

    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();

    if (!fn) errs.firstName = "First name is required";
    if (!ln) errs.lastName = "Last name is required";

    if (!normalizedPhone) errs.phoneNumber = "Phone number is required";
    else if (!isValidPhoneNumber(normalizedPhone)) errs.phoneNumber = "Enter a valid phone number";

    if (!normalizedEmail) errs.email = "Email is required";
    else if (!isValidEmail(normalizedEmail)) errs.email = "Enter a valid email address";

    if (!password) errs.password = "Password is required";
    else if (!isStrongPassword(password)) errs.password = passwordPolicyMessage();

    if (!confirmPassword) errs.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    setError("");
    setSuccess("");

    const ok = validateForm();
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
          phoneNumber: normalizedPhone,
          email: normalizedEmail,
          password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      const token = data.token;
      const user = data.user;

      if (!token || !user || !user.role) {
        setError("Invalid response from server");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userId", String(user.userId || ""));
      localStorage.setItem("firstName", user.firstName || "");
      localStorage.setItem("lastName", user.lastName || "");
      localStorage.setItem("email", user.email || normalizedEmail);
      localStorage.setItem("phone", user.phoneNumber || normalizedPhone);
      localStorage.setItem("role", user.role);

      setSuccess("Registration successful. Redirecting...");
      navigate("/player");
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
    <div className="reg-page">
      <div className="reg-card">
        <h2 className="reg-title">Player Registration</h2>

        {error ? <div className="reg-error">{error}</div> : null}
        {success ? <div className="reg-success">{success}</div> : null}

        <div className="reg-field">
          <label>First Name</label>
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          {fieldErrorText("firstName") ? <div className="reg-error-inline">{fieldErrorText("firstName")}</div> : null}
        </div>

        <div className="reg-field">
          <label>Last Name</label>
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          {fieldErrorText("lastName") ? <div className="reg-error-inline">{fieldErrorText("lastName")}</div> : null}
        </div>

        <div className="reg-field">
          <label>Phone Number</label>
          <input
            placeholder="07X XXX XXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          {fieldErrorText("phoneNumber") ? <div className="reg-error-inline">{fieldErrorText("phoneNumber")}</div> : null}
        </div>

        <div className="reg-field">
          <label>Email</label>
          <input
            placeholder="example@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrorText("email") ? <div className="reg-error-inline">{fieldErrorText("email")}</div> : null}
        </div>

        <div className="reg-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrorText("password") ? <div className="reg-error-inline">{fieldErrorText("password")}</div> : null}
        </div>

        <div className="reg-field">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {fieldErrorText("confirmPassword") ? (
            <div className="reg-error-inline">{fieldErrorText("confirmPassword")}</div>
          ) : null}
        </div>

        <button className="reg-btn" type="button" onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="reg-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}
