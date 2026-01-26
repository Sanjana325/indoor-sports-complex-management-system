import { useMemo, useState } from "react";

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
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 12 }}>My Profile</h2>

      <div style={{ maxWidth: 520, marginBottom: 24 }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Name:</strong> {`${user.firstName} ${user.lastName}`.trim() || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Email:</strong> {user.email || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Phone:</strong> {user.phone || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Role:</strong> {user.role || "-"}
        </div>

        {user.role === "COACH" ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <strong>Specialization:</strong> {user.specialization || "-"}
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong>Qualifications:</strong> {user.qualifications || "-"}
            </div>
          </>
        ) : null}
      </div>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Change Password</h3>

        {user.mustChangePassword ? (
          <div style={{ marginBottom: 12, padding: 10, background: "#fff7e6", border: "1px solid #ffd591" }}>
            Your account is using a temporary password. Please change it now.
          </div>
        ) : null}

        <form onSubmit={handleChangePassword} style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              autoComplete="current-password"
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6 }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              autoComplete="new-password"
            />
          </div>

          {errorMsg ? (
            <div style={{ marginBottom: 10, padding: 10, background: "#fff1f0", border: "1px solid #ffa39e" }}>
              {errorMsg}
            </div>
          ) : null}

          {successMsg ? (
            <div style={{ marginBottom: 10, padding: 10, background: "#f6ffed", border: "1px solid #b7eb8f" }}>
              {successMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #000",
              background: "#fff",
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
