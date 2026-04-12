import { useEffect, useMemo, useState } from "react";
import MultiSelectWithAdd from "../../components/MultiSelectWithAdd";
import adminService from "../../services/adminService";
import ArenaTable from "../../components/shared/ArenaTable";
import StatusPill from "../../components/shared/StatusPill";


function splitQualificationsToList(q) {
  if (!q) return [""];
  const parts = String(q).split(/[,;|]/g).map(x => x.trim()).filter(Boolean);
  return parts.length ? parts : [""];
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
    specializations: Array.isArray(u.Specializations) ? u.Specializations : splitQualificationsToList(u.Specializations),
    isActive: Boolean(u.IsActive)
  };
}

function buildHaystack(u) {
  const s = (v) => String(v ?? "").trim().toLowerCase();
  const id = s(u.idDisplay);
  const role = s(u.role);
  const first = s(u.firstName);
  const last = s(u.lastName);
  const phone = s(u.phone);
  const email = s(u.email);
  const qual = Array.isArray(u.qualifications) ? u.qualifications.join(" ") : s(u.qualifications);
  const spec = Array.isArray(u.specializations) ? u.specializations.join(" ") : s(u.specialization);
  const status = u.isActive ? "active" : "inactive";
  return `${id} ${role} ${first} ${last} ${phone} ${email} ${qual} ${spec} ${status}`.toLowerCase();
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
  const [role, setRole] = useState(ROLES[0] || "PLAYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qualifications, setQualifications] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [allSports, setAllSports] = useState([]);
  const [allQualifications, setAllQualifications] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");

  const fetchUsersFromDb = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getUsers();
      setUsers((data.users || []).map(mapDbUserToUi));
    } catch (err) { 
      console.error("Fetch users error:", err); 
    } finally { 
      setLoadingUsers(false); 
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [sportsData, qualData] = await Promise.all([
        adminService.getSports(),
        adminService.getQualifications()
      ]);
      
      setAllSports((sportsData.sports || sportsData).map(s => s.SportName || s));
      setAllQualifications((qualData.qualifications || qualData).map(q => q.QualificationName || q));
    } catch (e) { 
      console.error("Reference data fetch error:", e); 
    }
  };

  useEffect(() => { fetchUsersFromDb(); fetchReferenceData(); }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u => buildHaystack(u).includes(term));
  }, [users, search]);

  const sections = [
    { title: "Super Admins", rows: filteredUsers.filter(u => u.role === "SUPER_ADMIN"), visible: isSuperAdmin },
    { title: "Admins", rows: filteredUsers.filter(u => u.role === "ADMIN"), visible: isSuperAdmin },
    { title: "Staff", rows: filteredUsers.filter(u => u.role === "STAFF"), visible: true },
    { title: "Coaches", rows: filteredUsers.filter(u => u.role === "COACH"), visible: true, coach: true },
    { title: "Players", rows: filteredUsers.filter(u => u.role === "PLAYER"), visible: true }
  ];

  const resetForm = () => {
    setRole(ROLES[0] || "PLAYER"); setFirstName(""); setLastName(""); setPhone("");
    setEmail(""); setQualifications([]); setSpecializations([]); setEditingUserId(null); setFormError("");
  };

  const openAddModal = () => { setMode("ADD"); resetForm(); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const openEditModal = (u) => {
    setMode("EDIT"); setEditingUserId(u.userId); setRole(u.role); setFirstName(u.firstName);
    setLastName(u.lastName); setPhone(u.phone); setEmail(u.email);
    setQualifications(u.qualifications || []); setSpecializations(u.specializations || []);
    setIsModalOpen(true);
  };

  const handleDisableToggle = async (u) => {
    if (!window.confirm(`${u.isActive ? "Disable" : "Enable"} user ${u.email}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE}/api/admin/users/${u.userId}/${u.isActive ? "disable" : "enable"}`;
      const res = await fetch(url, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchUsersFromDb();
    } catch (e) { console.error(e); }
  };

  const handleRemoveUser = async (u) => {
    if (!window.confirm(`PERMANENTLY remove user ${u.email}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/users/${u.userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchUsersFromDb();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { role, firstName, lastName, email, phoneNumber: phone, specializations, qualifications };
    const token = localStorage.getItem("token");
    const method = mode === "ADD" ? "POST" : "PUT";
    const url = mode === "ADD" ? `${API_BASE}/api/admin/users` : `${API_BASE}/api/admin/users/${editingUserId}`;
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        if (mode === "ADD") {
          setCreatedEmail(email); setCreatedTempPassword(data.tempPassword || ""); setTempModalOpen(true);
        }
        setIsModalOpen(false); fetchUsersFromDb();
      } else setFormError(data.message || "Action failed");
    } catch (e) { setFormError("Server error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">User Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Control system access and user profiles</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={fetchUsersFromDb}>Refresh</button>
          <button className="btn btn-primary" onClick={openAddModal}>+ Add User</button>
        </div>
      </div>

      <div className="arena-card mb-3" style={{ padding: "var(--space-1)" }}>
        <input className="form-input" style={{ maxWidth: "400px" }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {sections.map(sec => sec.visible && sec.rows.length > 0 && (
        <div key={sec.title} className="mb-4">
          <h3 className="mb-2" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>{sec.title} ({sec.rows.length})</h3>
          <ArenaTable 
            loading={loadingUsers}
            data={sec.rows}
            columns={[
              { header: "ID" },
              { header: "Name" },
              { header: "Contact" },
              ...(sec.coach ? [{ header: "Qualifications & Specs" }] : []),
              { header: "Status" },
              { header: "Actions", style: { textAlign: "right" } }
            ]}
            renderRow={(u) => (
              <tr key={u.userId}>
                <td style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{u.idDisplay}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: "0.875rem" }}>{u.phone}</div>
                </td>
                {sec.coach && (
                  <td style={{ maxWidth: "250px" }}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {u.specializations.map(s => <StatusPill key={s} status="ACTIVE" label={s} />)}
                      {u.qualifications.map(q => <StatusPill key={q} status="PENDING" label={q} />)}
                    </div>
                  </td>
                )}
                <td>
                  <StatusPill status={u.isActive ? "ACTIVE" : "DISABLED"} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openEditModal(u)}>Edit</button>
                    <button className={`btn ${u.isActive ? "btn-secondary" : "btn-primary"}`} style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleDisableToggle(u)}>
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                    {isSuperAdmin && <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleRemoveUser(u)}>Del</button>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      ))}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-2)" }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="mb-2">{mode === "ADD" ? "Create New User" : "Update User Profile"}</h3>
            {formError && <div className="status-pill danger mb-2" style={{ width: "100%", borderRadius: "8px" }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)} required>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              {role === "COACH" && (
                <div className="mt-2" style={{ background: "#f8fafc", padding: "var(--space-2)", borderRadius: "var(--radius-md)" }}>
                  <h4 className="mb-1" style={{ fontSize: "0.9rem" }}>Coach Professional Details</h4>
                  <MultiSelectWithAdd label="Qualifications" options={allQualifications} value={qualifications} onChange={setQualifications} />
                  <MultiSelectWithAdd label="Specializations" options={allSports} value={specializations} onChange={setSpecializations} />
                </div>
              )}

              <div className="flex-between mt-3" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tempModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔑</div>
            <h3 className="mb-1">Temporary Password</h3>
            <p className="mb-2" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>A new account has been created for <strong>{createdEmail}</strong>.</p>
            <div style={{ background: "var(--primary-light)", padding: "1rem", borderRadius: "12px", border: "2px dashed var(--primary)", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "2px" }}>{createdTempPassword}</div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setTempModalOpen(false)}>Done, I've Saved It</button>
          </div>
        </div>
      )}
    </div>
  );
}
