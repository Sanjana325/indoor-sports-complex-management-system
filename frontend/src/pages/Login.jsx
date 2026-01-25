import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN"); // demo only

  function handleLogin(e) {
    e.preventDefault();

    if (role === "ADMIN") navigate("/admin");
    if (role === "STAFF") navigate("/staff");
    if (role === "COACH") navigate("/coach");
    if (role === "PLAYER") navigate("/player");
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h2 className="login-title">Login Page</h2>

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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="COACH">Coach</option>
            <option value="PLAYER">Player</option>
          </select>
        </div>

        <button type="submit" className="login-btn">
          Login
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
