import { useMemo, useState } from "react";
import "../../styles/UserManagement.css";

const ROLES = ["PLAYER", "STAFF", "COACH"];

function makeId(prefix = "U") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

function splitQualificationsToList(q) {
  // Accepts "A, B, C" OR "A; B" OR "A | B" etc. -> clean array
  if (!q) return [""];
  const parts = String(q)
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : [""];
}

function joinQualifications(list) {
  const cleaned = (list || []).map((x) => String(x || "").trim()).filter(Boolean);
  return cleaned.join(", ");
}

export default function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: "U-100001",
      role: "PLAYER",
      firstName: "Kavindi",
      lastName: "Silva",
      phone: "0771234567",
      email: "kavindi.player@sports.com",
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "U-100002",
      role: "STAFF",
      firstName: "Nuwan",
      lastName: "Perera",
      phone: "0712345678",
      email: "nuwan.staff@sports.com",
      createdAt: "2026-01-18T11:00:00.000Z",
    },
    {
      id: "U-100003",
      role: "COACH",
      firstName: "Sahan",
      lastName: "Fernando",
      phone: "0755555555",
      email: "sahan.coach@sports.com",
      qualifications: "Diploma in Sports Coaching",
      specialization: "Cricket",
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "U-100004",
      role: "PLAYER",
      firstName: "Tharushi",
      lastName: "Sanjana",
      phone: "0760000000",
      email: "tharushi.player@sports.com",
      createdAt: "2026-01-19T08:00:00.000Z",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  const [role, setRole] = useState("PLAYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Changed: qualifications is now an array (dynamic inputs)
  const [qualificationsList, setQualificationsList] = useState([""]);
  const [specialization, setSpecialization] = useState("");

  const [tempPassword, setTempPassword] = useState("");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;

    return users.filter((u) => {
      const haystack =
        `${u.id} ${u.role} ${u.firstName} ${u.lastName} ${u.phone} ${u.email} ` +
        `${u.qualifications ?? ""} ${u.specialization ?? ""}`.toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [users, normalizedSearch]);

  const latestPlayers = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "PLAYER")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [filteredUsers]);

  const latestStaff = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "STAFF")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [filteredUsers]);

  const latestCoaches = useMemo(() => {
    return filteredUsers
      .filter((u) => u.role === "COACH")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [filteredUsers]);

  function resetForm() {
    setRole("PLAYER");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");

    setQualificationsList([""]);
    setSpecialization("");

    setTempPassword("");
    setEditingId(null);
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setMode("EDIT");
    setEditingId(user.id);

    setRole(user.role);
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone || "");
    setEmail(user.email || "");

    // ✅ Convert existing string to array inputs
    setQualificationsList(splitQualificationsToList(user.qualifications || ""));
    setSpecialization(user.specialization || "");

    setTempPassword("");

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleRemove(id) {
    const ok = window.confirm("Remove this user?");
    if (!ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function validateForm() {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!phone.trim()) return "Phone number is required";
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Enter a valid email";
    if (!ROLES.includes(role)) return "Role must be Player/Staff/Coach";

    if (mode === "ADD") {
      if (!tempPassword.trim()) return "Temporary password is required";
      if (tempPassword.trim().length < 6) return "Temporary password must be at least 6 characters";
    }

    if (role === "COACH") {
      const qJoined = joinQualifications(qualificationsList);
      if (!qJoined.trim()) return "Qualifications is required for Coach";
      if (!specialization.trim()) return "Specialization is required for Coach";
    }

    return null;
  }

  function handleRoleChange(newRole) {
    setRole(newRole);
    if (newRole !== "COACH") {
      setQualificationsList([""]);
      setSpecialization("");
    }
  }

  // ✅ Qualifications handlers
  function addQualificationRow() {
    setQualificationsList((prev) => [...prev, ""]);
  }

  function updateQualificationRow(idx, value) {
    setQualificationsList((prev) => prev.map((q, i) => (i === idx ? value : q)));
  }

  function removeQualificationRow(idx) {
    setQualificationsList((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [""];
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const base = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    const coachExtra =
      role === "COACH"
        ? {
            qualifications: joinQualifications(qualificationsList),
            specialization: specialization.trim(),
          }
        : {
            qualifications: undefined,
            specialization: undefined,
          };

    if (mode === "ADD") {
      const newUser = {
        id: makeId("U"),
        ...base,
        ...coachExtra,
        tempPassword: tempPassword.trim(),
        createdAt: nowIso(),
      };
      setUsers((prev) => [newUser, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingId
          ? {
              ...u,
              ...base,
              ...coachExtra,
            }
          : u
      )
    );

    closeModal();
    resetForm();
  }

  return (
    <div className="um-page">
      <div className="um-header">
        <div>
          <h2 className="um-title">User Management</h2>
        </div>

        <button className="um-primary-btn" type="button" onClick={openAddModal}>
          + Add User
        </button>
      </div>

      <div className="um-toolbar">
        <input
          className="um-search"
          placeholder="Search by name, email, phone, user id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="um-section">
        <h3 className="um-section-title">Players</h3>
        <UserTable rows={latestPlayers} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Staff</h3>
        <UserTable rows={latestStaff} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Coaches</h3>
        <UserTable rows={latestCoaches} onEdit={openEditModal} onRemove={handleRemove} showCoachCols />
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

            <form className="um-form" onSubmit={handleSubmit}>
              <div className="um-grid">
                <div className="um-field">
                  <label>Role</label>
                  <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
                    <option value="PLAYER">Player</option>
                    <option value="STAFF">Staff</option>
                    <option value="COACH">Coach</option>
                  </select>
                </div>

                <div className="um-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="um-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="um-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="um-field um-full">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {mode === "ADD" && (
                  <div className="um-field um-full">
                    <label>Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Enter temporary password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                    />
                  </div>
                )}

                {role === "COACH" && (
                  <>
                    {/* ✅ Qualifications (dynamic list with +) */}
                    <div className="um-field um-full">
                      <div className="um-label-row">
                        <label>Qualifications</label>
                        <button
                          type="button"
                          className="um-qual-add-btn"
                          onClick={addQualificationRow}
                          aria-label="Add qualification"
                          title="Add qualification"
                        >
                          +
                        </button>
                      </div>

                      <div className="um-qual-list">
                        {qualificationsList.map((q, idx) => (
                          <div key={idx} className="um-qual-row">
                            <input
                              type="text"
                              placeholder="e.g., Diploma in Sports Coaching"
                              value={q}
                              onChange={(e) => updateQualificationRow(idx, e.target.value)}
                            />

                            <button
                              type="button"
                              className="um-action-btn danger um-qual-remove"
                              onClick={() => removeQualificationRow(idx)}
                              aria-label="Remove qualification"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="um-qual-hint">
                        Add one or more qualifications (use + to add more).
                      </div>
                    </div>

                    <div className="um-field um-full">
                      <label>Specialization</label>
                      <input
                        type="text"
                        placeholder="e.g., Cricket / Badminton / Chess"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* ✅ Only these 2 modal buttons become white */}
              <div className="um-form-actions">
                <button className="um-modal-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="um-modal-btn" type="submit">
                  {mode === "ADD" ? "Add User" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserTable({ rows, onEdit, onRemove, showCoachCols = false }) {
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
              <tr key={u.id}>
                <td className="um-col-id">{u.id}</td>
                <td className="um-col-name">
                  {u.firstName} {u.lastName}
                </td>

                {showCoachCols ? (
                  <>
                    <td className="um-col-phone">{u.phone}</td>
                    <td className="um-col-email">{u.email}</td>
                    <td className="um-col-qual">{u.qualifications || "-"}</td>
                    <td className="um-col-spec">{u.specialization || "-"}</td>
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
                    <button className="um-action-btn danger" type="button" onClick={() => onRemove(u.id)}>
                      Remove
                    </button>
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
