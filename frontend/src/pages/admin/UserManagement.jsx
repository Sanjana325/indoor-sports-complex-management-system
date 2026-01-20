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

export default function UserManagement() {
  // UI-only mock data (later connect to backend)
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [role, setRole] = useState("PLAYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // quick filter
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((u) => {
      const haystack = `${u.id} ${u.role} ${u.firstName} ${u.lastName} ${u.phone} ${u.email}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [users, normalizedSearch]);

  const latestPlayers = useMemo(
    () =>
      filteredUsers
        .filter((u) => u.role === "PLAYER")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredUsers]
  );

  const latestStaff = useMemo(
    () =>
      filteredUsers
        .filter((u) => u.role === "STAFF")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredUsers]
  );

  const latestCoaches = useMemo(
    () =>
      filteredUsers
        .filter((u) => u.role === "COACH")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredUsers]
  );

  function resetForm() {
    setRole("PLAYER");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
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
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
    setEmail(user.email);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this user?");
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
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    if (mode === "ADD") {
      const newUser = {
        id: makeId("U"),
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: nowIso(),
      };
      setUsers((prev) => [newUser, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    if (mode === "EDIT") {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                role,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                email: email.trim(),
              }
            : u
        )
      );
      closeModal();
      resetForm();
    }
  }

  return (
    <div className="um-page">
      <div className="um-header">
        <div>
          <h2 className="um-title">User Management</h2>
          <p className="um-subtitle">Add, edit, and remove users (UI-only for now).</p>
        </div>

        <button className="um-primary-btn" onClick={openAddModal}>
          + Add User
        </button>
      </div>

      <div className="um-toolbar">
        <input
          className="um-search"
          placeholder="Search by name, email, phone, id, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 3 TABLES */}
      <section className="um-section">
        <h3 className="um-section-title">Players (Last 5 Added)</h3>
        <UserTable rows={latestPlayers} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Staff (Last 5 Added)</h3>
        <UserTable rows={latestStaff} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="um-section">
        <h3 className="um-section-title">Coaches (Last 5 Added)</h3>
        <UserTable rows={latestCoaches} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      {/* MODAL */}
      {isModalOpen && (
        <div className="um-modal-backdrop" onMouseDown={closeModal}>
          <div className="um-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>{mode === "ADD" ? "Add User" : "Edit User"}</h3>
              <button className="um-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="um-form" onSubmit={handleSubmit}>
              <div className="um-grid">
                <div className="um-field">
                  <label>Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
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
              </div>

              <div className="um-form-actions">
                <button className="um-secondary-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="um-primary-btn" type="submit">
                  {mode === "ADD" ? "Add User" : "Save Changes"}
                </button>
              </div>

              <p className="um-hint">
                Note: This is UI-only. Backend integration will enforce rules (e.g., players can self-register).
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserTable({ rows, onEdit, onRemove }) {
  return (
    <div className="um-table-wrap">
      <table className="um-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th className="um-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="5" className="um-empty">
                No users to show.
              </td>
            </tr>
          ) : (
            rows.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.phone}</td>
                <td>{u.email}</td>
                <td className="um-center">
                  <button className="um-link-btn" type="button" onClick={() => onEdit(u)}>
                    Edit
                  </button>
                  <span className="um-sep">|</span>
                  <button className="um-link-btn danger" type="button" onClick={() => onRemove(u.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
