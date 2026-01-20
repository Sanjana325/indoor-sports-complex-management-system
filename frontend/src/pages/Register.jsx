import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleRegister(e) {
    e.preventDefault();

    // UI-only validation for now
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert("Player registered (UI only)");
  }

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleRegister}>
        <h2 className="register-title">Player Registration</h2>

        <label>First Name</label>
        <input
          type="text"
          placeholder="Enter first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <label>Last Name</label>
        <input
          type="text"
          placeholder="Enter last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <label>Phone Number</label>
        <input
          type="tel"
          placeholder="e.g. 0771234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

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

        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" className="register-btn">
          Register
        </button>

        <p className="login-text">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}
