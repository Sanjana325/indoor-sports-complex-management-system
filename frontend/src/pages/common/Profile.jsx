import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getInitials } from "../../utils/formatters";

const API_BASE = "http://localhost:5000/api";

// universal profile management page for all user roles (admin, coach, player, staff)
export default function Profile() {
  const { updateUser } = useAuth();
  
  // initializes user state from browser localstorage for instant loading
  const [user, setUserProfile] = useState({
    userId: localStorage.getItem("userId") || "",
    firstName: localStorage.getItem("firstName") || "",
    lastName: localStorage.getItem("lastName") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    role: localStorage.getItem("role") || "",
    specialization: localStorage.getItem("specialization") || "",
    qualifications: localStorage.getItem("qualifications") || "",
    mustChangePassword: localStorage.getItem("mustChangePassword") === "true",
  });

  const initials = getInitials(user.firstName, user.lastName);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // sends updated name and contact details to the auth profile endpoint
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!editForm.firstName || !editForm.lastName) {
      setProfileError("First Name and Last Name are required.");
      return;
    }

    const token = localStorage.getItem("token");
    setProfileSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phoneNumber: editForm.phone
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setProfileError(data.message || "Failed to update profile.");
        return;
      }

      const updatedData = {
        ...user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phone: data.user.phoneNumber
      };
      
      setUserProfile(updatedData);
      updateUser({ firstName: data.user.firstName, lastName: data.user.lastName });
      
      localStorage.setItem("phone", data.user.phoneNumber || "");
      
      setIsEditing(false);
      setProfileSuccess("Profile updated successfully.");
      
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError("Network error. Please try again.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // validates and submits password rotation request with strict 8-char enforcement
  async function handleChangePassword(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg("Please fill all password fields.");
      return;
    }

    if (String(newPassword).length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
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
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.message || "Failed to change password.");
        return;
      }

      updateUser({ mustChangePassword: false });
      
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
    <div className="profile-page-container" style={{ padding: "var(--space-3)" }}>
      {/* visual hero banner displaying current user identity and role initials */}
      <header className="profile-hero">
        <div className="profile-hero-avatar">
          {initials}
        </div>
        <div className="profile-hero-info">
          <h1>{`${user.firstName} ${user.lastName}`}</h1>
          <p>{user.email}</p>
          <div className="profile-badge">{user.role.replace('_', ' ')}</div>
        </div>
      </header>

      <div className="profile-grid">
        {/* left column for viewing or editing primary personal contact details */}
        <section className="arena-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="info-section-title" style={{ marginBottom: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Personal Information
            </h2>
            {!isEditing && (
              <button 
                onClick={() => {
                  setEditForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
                  setIsEditing(true);
                }} 
                className="btn btn-outline" 
                style={{ padding: "6px 12px", fontSize: "0.85rem", height: "100%" }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {profileError && (
             <div className="profile-alert profile-alert-error" style={{marginBottom: "1rem"}}>
                {profileError}
             </div>
          )}
          {profileSuccess && (
             <div className="profile-alert profile-alert-success" style={{marginBottom: "1rem"}}>
                {profileSuccess}
             </div>
          )}

          {isEditing ? (
            /* interactive form for modifying name and telephone number */
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              
              <div className="info-row" style={{ marginTop: "1rem" }}>
                <span className="info-row-label">Email Address (Cannot be changed)</span>
                <span className="info-row-value">{user.email}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={profileSubmitting}>
                  {profileSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn btn-outline" disabled={profileSubmitting} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* read-only layout for displaying saved personal attributes */
            <>
              <div className="info-row">
                <div className="info-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className="info-row-content">
                  <span className="info-row-label">Email Address</span>
                  <span className="info-row-value">{user.email}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className="info-row-content">
                  <span className="info-row-label">Phone Number</span>
                  <span className="info-row-value">{user.phone || "Not provided"}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                </div>
                <div className="info-row-content">
                  <span className="info-row-label">System Role</span>
                  <span className="info-row-value">{user.role}</span>
                </div>
              </div>

              {user.role === "COACH" && (
                /* conditional coach-specific specialization and qualification fields */
                <>
                  <div className="info-row">
                    <div className="info-row-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    </div>
                    <div className="info-row-content">
                      <span className="info-row-label">Specialization</span>
                      <span className="info-row-value">{user.specialization}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-row-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    </div>
                    <div className="info-row-content">
                      <span className="info-row-label">Qualifications</span>
                      <span className="info-row-value">{user.qualifications}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* right column for secure credential management and mandatory password resets */}
        <section className="arena-card">
          <h2 className="info-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Security Settings
          </h2>

          {user.mustChangePassword && (
            <div className="security-warning-card">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span><strong>Action Required:</strong> Please change your temporary password to secure your account.</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="profile-alert profile-alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="profile-alert profile-alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "var(--space-2)" }}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}