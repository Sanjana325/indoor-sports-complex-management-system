import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          email,
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
      localStorage.setItem("email", user.email || email);
      localStorage.setItem("phone", user.phoneNumber || phoneNumber);
      localStorage.setItem("role", user.role);

      setSuccess("Registration successful. Redirecting...");
      navigate("/player");
    } catch (err) {
      setError("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
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
        </div>

        <div className="reg-field">
          <label>Last Name</label>
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="reg-field">
          <label>Phone Number</label>
          <input
            placeholder="07X XXX XXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
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
