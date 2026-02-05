import { useMemo, useState } from "react";
import "../../styles/Profile.css";

const API_BASE = "http://localhost:5000/api";

export default function Profile() {
  const user = useMemo(() => {
    const userId = localStorage.getItem("userId") || "";
    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    const email = localStorage.getItem("email") || "";
    const phone = localStorage.getItem("phone") || "";
    const role = localStorage.getItem("role") || "";

    const specialization = localStorage.getItem("specialization") || "";
    const qualifications = localStorage.getItem("qualifications") || "";

    const mustChangePassword = localStorage.getItem("mustChangePassword") === "true";

    return {
      userId,
      firstName,
      lastName,
      email,
      phone,
      role,
      specialization,
      qualifications,
      mustChangePassword
    };
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleChangePassword(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg("Please fill all password fields.");
      return;
    }

    if (String(newPassword).length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMsg("You are not logged in. Please login again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.message || "Failed to change password.");
        return;
      }

      localStorage.setItem("mustChangePassword", "false");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccessMsg("Password updated successfully.");
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-header-content">
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">View and manage your account information</p>
          </div>
          <div className="profile-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </header>

        <div className="profile-content">
          <section className="profile-info-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Personal Information
            </h2>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">Full Name</span>
                  <span className="profile-info-value">{`${user.firstName} ${user.lastName}`.trim() || "-"}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">Email Address</span>
                  <span className="profile-info-value">{user.email || "-"}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">Phone Number</span>
                  <span className="profile-info-value">{user.phone || "-"}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">Role</span>
                  <span className="profile-info-value profile-role-badge">{user.role || "-"}</span>
                </div>
              </div>

              {user.role === "COACH" && (
                <>
                  <div className="profile-info-item profile-info-full">
                    <div className="profile-info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div className="profile-info-content">
                      <span className="profile-info-label">Specialization</span>
                      <span className="profile-info-value">{user.specialization || "-"}</span>
                    </div>
                  </div>

                  <div className="profile-info-item profile-info-full">
                    <div className="profile-info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                    <div className="profile-info-content">
                      <span className="profile-info-label">Qualifications</span>
                      <span className="profile-info-value">{user.qualifications || "-"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="profile-password-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change Password
            </h2>

            {user.mustChangePassword && (
              <div className="profile-warning-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Your account is using a temporary password. Please change it now.</span>
              </div>
            )}

            <form className="profile-password-form" onSubmit={handleChangePassword}>
              <div className="profile-form-field">
                <label>Current Password</label>
                <div className="profile-input-wrapper">
                  <svg className="profile-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="profile-form-field">
                <label>New Password</label>
                <div className="profile-input-wrapper">
                  <svg className="profile-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="profile-form-field">
                <label>Confirm New Password</label>
                <div className="profile-input-wrapper">
                  <svg className="profile-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="profile-alert profile-alert-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="profile-alert profile-alert-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="profile-submit-btn"
              >
                {submitting ? (
                  <>
                    <svg className="profile-spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Update Password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}