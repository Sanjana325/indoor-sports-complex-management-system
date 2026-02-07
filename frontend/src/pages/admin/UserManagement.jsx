import { useEffect, useMemo, useState } from "react";
import "../../styles/UserManagement.css";
import MultiSelectWithAdd from "../../components/MultiSelectWithAdd";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function splitQualificationsToList(q) {
  if (!q) return [""];
  const parts = String(q)
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : [""];
}

function joinQualifications(list) {
  const cleaned = (list || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  return cleaned.join(", ");
}

function normalizeQualifications(list) {
  const cleaned = (list || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function displayUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n)) return String(userId || "-");
  return `U-${String(n).padStart(6, "0")}`;
}

function mapDbUserToUi(u) {
  return {
    userId: u.UserID,
    idDisplay: displayUserId(u.UserID),
    role: u.Role,
    firstName: u.FirstName || "",
    lastName: u.LastName || "",
    phone: u.PhoneNumber || "",
    email: u.Email || "",
    createdAt: u.CreatedAt,
    specialization: u.Specialization || "",
    qualifications: Array.isArray(u.Qualifications) ? u.Qualifications : splitQualificationsToList(u.Qualifications),
    specializations: Array.isArray(u.Specializations)
      ? u.Specializations
      : splitQualificationsToList(u.Specializations),
    isActive: Boolean(u.IsActive)
  };
}

function s(v) {
  return String(v ?? "").trim();
}

function buildHaystack(u) {
  const id = s(u.idDisplay);
  const role = s(u.role);
  const first = s(u.firstName);
  const last = s(u.lastName);
  const phone = s(u.phone);
  const email = s(u.email);

  const qual = Array.isArray(u.qualifications) ? u.qualifications.join(" ") : s(u.qualifications);
  const spec = Array.isArray(u.specializations) ? u.specializations.join(" ") : s(u.specialization);
  const status = u.isActive ? "active" : "inactive";

  const fullName = `${first} ${last}`.trim();
  const swappedName = `${last} ${first}`.trim();

  return `${id} ${role} ${first} ${last} ${fullName} ${swappedName} ${phone} ${email} ${qual} ${spec} ${status}`.toLowerCase();
}

export default function UserManagement() {
  const currentRole = localStorage.getItem("role") || "";
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const canManageUsers = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";

  const ROLES = isSuperAdmin ? ["ADMIN", "PLAYER", "STAFF", "COACH"] : ["PLAYER", "STAFF", "COACH"];

  const [users, setUsers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingUserId, setEditingUserId] = useState(null);

  const [roles, setRoles] = useState(ROLES); // Use state if we want to dynamic, but constant is fine. 

  const [role, setRole] = useState(ROLES[0] || "PLAYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Coach specific
  const [qualifications, setQualifications] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  // Reference data
  const [allSports, setAllSports] = useState([]);
  const [allQualifications, setAllQualifications] = useState([]);

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [listError, setListError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");

  async function fetchUsersFromDb() {
    setLoadingUsers(true);
    setListError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setListError("Not logged in. Please login again.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setListError(data.message || "Failed to load users");
        return;
      }

      const rows = Array.isArray(data.users) ? data.users : [];
      setUsers(rows.map(mapDbUserToUi));
    } catch (err) {
      setListError("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchReferenceData() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch Sports
      const resSports = await fetch(`${API_BASE}/api/admin/sports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resSports.ok) {
        const data = await resSports.json();
        const list = Array.isArray(data.sports) ? data.sports : (Array.isArray(data) ? data : []);
        setAllSports(list.map(s => s.SportName || s.sportName || s.name || s));
      }

      // Fetch Qualifications
      const resQuals = await fetch(`${API_BASE}/api/admin/qualifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resQuals.ok) {
        const data = await resQuals.json();
        const list = Array.isArray(data.qualifications) ? data.qualifications : (Array.isArray(data) ? data : []);
        setAllQualifications(list.map(q => q.QualificationName || q.qualificationName || q.name || q));
      }
    } catch (e) {
      console.error("Failed to fetch reference data", e);
    }
  }

  useEffect(() => {
    fetchUsersFromDb();
    fetchReferenceData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((u) => buildHaystack(u).includes(normalizedSearch));
  }, [users, normalizedSearch]);

  const latestSuperAdmins = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "SUPER_ADMIN")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }, [filteredUsers]);

  const latestAdmins = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "ADMIN")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }, [filteredUsers]);

  const latestPlayers = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "PLAYER")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }, [filteredUsers]);

  const latestStaff = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "STAFF")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }, [filteredUsers]);

  const latestCoaches = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "COACH")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }, [filteredUsers]);

  function resetForm() {
    setRole(ROLES[0] || "PLAYER");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setQualifications([]);
    setSpecializations([]);
    setEditingUserId(null);
    setFormError("");
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    setIsModalOpen(true);
    fetchReferenceData(); // Refresh ref data
  }

  function openEditModal(user) {
    setMode("EDIT");
    setEditingUserId(user.userId);

    setRole(user.role);
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone || "");
    setEmail(user.email || "");

    setQualifications(user.qualifications || []);
    setSpecializations(user.specializations || []);

    setFormError("");
    setIsModalOpen(true);
    fetchReferenceData(); // Refresh ref data
  }

  function closeModal() {
    if (submitting) return;
    setIsModalOpen(false);
  }

  function closeTempModal() {
    setTempModalOpen(false);
    setCreatedTempPassword("");
    setCreatedEmail("");
  }

  function validateForm() {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!phone.trim()) return "Phone number is required";
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Enter a valid email";
    if (!ROLES.includes(role)) return "Role must be valid";

    if (role === "COACH") {
      if (qualifications.length === 0) return "At least one qualification is required for Coach";
      if (specializations.length === 0) return "At least one specialization is required for Coach";
    }

    return null;
  }

  function handleRoleChange(newRole) {
    setRole(newRole);
    if (newRole !== "COACH") {
      setQualifications([]);
      setSpecializations([]);
    }
  }

  async function handleAddNewSport(newSportName) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sportName: newSportName })
      });
      if (res.ok) {
        setAllSports(prev => [...prev, newSportName]);
        setSpecializations(prev => [...prev, newSportName]);
      }
    } catch (e) {
      console.error("Failed to add sport", e);
    }
  }

  async function handleAddNewQualification(newQualName) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/qualifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qualificationName: newQualName })
      });
      if (res.ok) {
        setAllQualifications(prev => [...prev, newQualName]);
        setQualifications(prev => [...prev, newQualName]);
      }
    } catch (e) {
      console.error("Failed to add qualification", e);
    }
  }

  async function createUserOnBackend(payload) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not logged in. Please login again.");

    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || "Failed to create user";
      throw new Error(msg);
    }

    return data;
  }

  async function updateUserOnBackend(userId, payload) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not logged in. Please login again.");

    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.message || "Failed to update user";
      throw new Error(msg);
    }

    return data;
  }

  async function setUserActive(userId, makeActive) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not logged in. Please login again.");

    const url = makeActive
      ? `${API_BASE}/api/admin/users/${userId}/enable`
      : `${API_BASE}/api/admin/users/${userId}/disable`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Action failed");
    return data;
  }

  async function removeUserHard(userId) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not logged in. Please login again.");

    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Remove failed");
    return data;
  }

  async function handleDisableToggle(user) {
    if (!canManageUsers) return;

    const actionLabel = user.isActive ? "Disable User" : "Enable User";
    const ok = window.confirm(`${actionLabel} for ${user.firstName} ${user.lastName} (${user.email})?`);
    if (!ok) return;

    try {
      await setUserActive(user.userId, !user.isActive);
      await fetchUsersFromDb();
    } catch (ex) {
      setListError(ex.message || "Action failed");
    }
  }

  async function handleRemoveUser(user) {
    if (!isSuperAdmin) return;

    const ok = window.confirm(
      `Remove user permanently?\n\nThis will delete the account and related coach records.\nUser: ${user.firstName} ${user.lastName} (${user.email})`
    );
    if (!ok) return;

    try {
      await removeUserHard(user.userId);
      await fetchUsersFromDb();
    } catch (ex) {
      setListError(ex.message || "Remove failed");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    const payload =
      role === "COACH"
        ? {
          role,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phone.trim(),
          specializations: specializations,
          qualifications: qualifications
        }
        : {
          role,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phone.trim()
        };

    setSubmitting(true);
    try {
      if (mode === "ADD") {
        const result = await createUserOnBackend(payload);

        setCreatedEmail(payload.email);
        setCreatedTempPassword(result.tempPassword || "");
        setTempModalOpen(true);

        setIsModalOpen(false);
        resetForm();

        await fetchUsersFromDb();
        return;
      }

      if (!editingUserId) {
        setFormError("No user selected to update");
        return;
      }

      await updateUserOnBackend(editingUserId, payload);

      setIsModalOpen(false);
      resetForm();
      await fetchUsersFromDb();
    } catch (ex) {
      setFormError(ex.message || (mode === "ADD" ? "Failed to create user" : "Failed to update user"));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTempPassword() {
    if (!createdTempPassword) return;
    try {
      await navigator.clipboard.writeText(createdTempPassword);
    } catch (e) { }
  }

  return (
    <div className="um-page">
      <div className="um-header">
        <div>
          <h2 className="um-title">User Management</h2>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="um-secondary-btn" type="button" onClick={fetchUsersFromDb} disabled={loadingUsers}>
            {loadingUsers ? "Refreshing..." : "Refresh"}
          </button>
          <button className="um-primary-btn" type="button" onClick={openAddModal}>
            + Add User
          </button>
        </div>
      </div>

      {listError ? <div className="um-alert um-alert--error">{listError}</div> : null}

      <div className="um-toolbar">
        <input
          className="um-search"
          placeholder="Search by name, email, phone, user id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isSuperAdmin ? (
        <>
          {latestSuperAdmins.length > 0 ? (
            <section className="um-section">
              <h3 className="um-section-title">Super Admins</h3>
              <UserTable
                rows={latestSuperAdmins}
                onEdit={openEditModal}
                onDisableToggle={handleDisableToggle}
                onRemove={handleRemoveUser}
                currentRole={currentRole}
              />
            </section>
          ) : null}

          <section className="um-section">
            <h3 className="um-section-title">Admins</h3>
            <UserTable
              rows={latestAdmins}
              onEdit={openEditModal}
              onDisableToggle={handleDisableToggle}
              onRemove={handleRemoveUser}
              currentRole={currentRole}
            />
          </section>
        </>
      ) : null}

      <section className="um-section">
        <h3 className="um-section-title">Players</h3>
        <UserTable
          rows={latestPlayers}
          onEdit={openEditModal}
          onDisableToggle={handleDisableToggle}
          onRemove={handleRemoveUser}
          currentRole={currentRole}
        />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Staff</h3>
        <UserTable
          rows={latestStaff}
          onEdit={openEditModal}
          onDisableToggle={handleDisableToggle}
          onRemove={handleRemoveUser}
          currentRole={currentRole}
        />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Coaches</h3>
        <UserTable
          rows={latestCoaches}
          onEdit={openEditModal}
          onDisableToggle={handleDisableToggle}
          onRemove={handleRemoveUser}
          showCoachCols
          currentRole={currentRole}
        />
      </section>

      {isModalOpen && (
        <div className="um-modal-backdrop" onMouseDown={closeModal}>
          <div className="um-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3 className="um-modal-title">{mode === "ADD" ? "Add User" : "Edit User"}</h3>
              <button className="um-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            {formError ? <div className="um-alert um-alert--error">{formError}</div> : null}

            <form className="um-form" onSubmit={handleSubmit}>
              <div className="um-grid">
                <div className="um-field">
                  <label>Role</label>
                  <select value={role} onChange={(e) => handleRoleChange(e.target.value)} disabled={submitting}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r === "SUPER_ADMIN" ? "Super Admin" : r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="um-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="um-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="um-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="um-field um-full">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {mode === "ADD" ? (
                  <div className="um-alert um-alert--info um-full">
                    Temporary password will be generated by the system after creating the user.
                  </div>
                ) : null}

                {role === "COACH" && (
                  <>
                    <MultiSelectWithAdd
                      label="Qualifications"
                      placeholder="Select or type to add..."
                      value={qualifications}
                      options={allQualifications}
                      onChange={setQualifications}
                      onAdd={handleAddNewQualification}
                    />

                    <MultiSelectWithAdd
                      label="Specialization"
                      placeholder="Select or type to add..."
                      value={specializations}
                      options={allSports}
                      onChange={setSpecializations}
                      onAdd={handleAddNewSport}
                    />
                  </>
                )}
              </div>

              <div className="um-form-actions">
                <button className="um-modal-btn" type="button" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button className="um-modal-btn" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : mode === "ADD" ? "Add User" : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tempModalOpen && (
        <div className="um-modal-backdrop" onMouseDown={closeTempModal}>
          <div className="um-modal um-modal--small" onMouseDown={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3 className="um-modal-title">Temporary Password</h3>
              <button className="um-icon-btn" type="button" onClick={closeTempModal} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="um-alert um-alert--info">
              Copy this password now and share it with the user. The system will not show it again.
            </div>

            <div className="um-temp-box">
              <div className="um-temp-row">
                <div className="um-temp-label">User Email</div>
                <div className="um-temp-value">{createdEmail || "-"}</div>
              </div>

              <div className="um-temp-row">
                <div className="um-temp-label">Temporary Password</div>
                <div className="um-temp-value um-temp-password">{createdTempPassword || "-"}</div>
              </div>

              <div className="um-temp-actions">
                <button className="um-action-btn" type="button" onClick={copyTempPassword}>
                  Copy Password
                </button>
                <button className="um-action-btn danger" type="button" onClick={closeTempModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserTable({ rows, onEdit, onDisableToggle, onRemove, showCoachCols = false, currentRole }) {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  return (
    <div className="um-table-wrap">
      <table className={`um-table ${showCoachCols ? "um-table--coach" : ""}`}>
        <thead>
          <tr>
            <th className="um-col-id">User ID</th>
            <th className="um-col-name">Name</th>

            {showCoachCols ? (
              <>
                <th className="um-col-phone">Phone</th>
                <th className="um-col-email">Email</th>
                <th className="um-col-qual">Qualifications</th>
                <th className="um-col-spec">Specialization</th>
              </>
            ) : (
              <>
                <th className="um-col-phone">Phone</th>
                <th className="um-col-email">Email</th>
              </>
            )}

            <th className="um-col-actions um-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showCoachCols ? 7 : 5} className="um-empty">
                No users found.
              </td>
            </tr>
          ) : (
            rows.map((u) => (
              <tr key={u.userId}>
                <td className="um-col-id">{u.idDisplay}</td>
                <td className="um-col-name">
                  {u.firstName} {u.lastName}
                  {!u.isActive ? <span style={{ marginLeft: 8, fontSize: 12, color: "#a00" }}>(Disabled)</span> : null}
                </td>

                {showCoachCols ? (
                  <>
                    <td className="um-col-phone">{u.phone}</td>
                    <td className="um-col-email">{u.email}</td>
                    <td className="um-col-qual">{Array.isArray(u.qualifications) ? u.qualifications.join(", ") : u.qualifications}</td>
                    <td className="um-col-spec">{Array.isArray(u.specializations) ? u.specializations.join(", ") : u.specializations || u.specialization || "-"}</td>
                  </>
                ) : (
                  <>
                    <td className="um-col-phone">{u.phone}</td>
                    <td className="um-col-email">{u.email}</td>
                  </>
                )}

                <td className="um-col-actions um-center">
                  <div className="um-actions">
                    <button className="um-action-btn" type="button" onClick={() => onEdit(u)}>
                      Edit
                    </button>

                    <button className="um-action-btn" type="button" onClick={() => onDisableToggle(u)}>
                      {u.isActive ? "Disable User" : "Enable User"}
                    </button>

                    {isSuperAdmin ? (
                      <button className="um-action-btn danger" type="button" onClick={() => onRemove(u)}>
                        Remove User
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
