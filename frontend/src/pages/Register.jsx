import { Link } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  return (
    <div className="reg-page">
      <div className="reg-card">
        <h2 className="reg-title">Player Registration</h2>

        <div className="reg-field">
          <label>First Name</label>
          <input placeholder="First name" />
        </div>

        <div className="reg-field">
          <label>Last Name</label>
          <input placeholder="Last name" />
        </div>

        <div className="reg-field">
          <label>Phone Number</label>
          <input placeholder="07X XXX XXXX" />
        </div>

        <div className="reg-field">
          <label>Email</label>
          <input placeholder="example@email.com" />
        </div>

        <div className="reg-field">
          <label>Password</label>
          <input type="password" placeholder="Enter password" />
        </div>

        <button className="reg-btn" type="button">
          Register
        </button>

        <p className="reg-link">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}
