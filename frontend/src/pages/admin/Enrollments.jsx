import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_OPTIONS = ["ALL", "ENROLLED", "CANCELLED", "COMPLETED"];

function billingLabel(t) {
  return t === "ONE_TIME" ? "One-time" : "Monthly";
}

function feeStatusLabel(s) {
  if (s === "PAID") return "Full Paid";
  if (s === "DUE") return "Due Balance";
  if (s === "PENDING_VERIFICATION") return "Verifying...";
  if (s === "OVERDUE") return "Overdue";
  return s;
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const getBasePath = () => localStorage.getItem("role") === "STAFF" ? "/api/staff" : "/api/admin";
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => { fetchEnrollments(); }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}${getBasePath()}/enrollments`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(enrollments.map((e) => e.className)));
    unique.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...unique];
  }, [enrollments]);

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const classOk = classFilter === "ALL" || e.className === classFilter;
      const statusOk = statusFilter === "ALL" || e.status === statusFilter;
      return classOk && statusOk;
    });
  }, [enrollments, classFilter, statusFilter]);

  async function handleCancel(enrollmentId, rawId) {
    if (!window.confirm("Safe-void this enrollment? Access will be revoked but records preserved.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${rawId}/cancel`, { method: "PATCH", headers: getHeaders() });
      if (res.ok) {
        setEnrollments(prev => prev.map(e => e.id === rawId ? { ...e, status: "CANCELLED" } : e));
      }
    } catch (err) { alert("Action failed"); }
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Enrollments</h2>
        </div>
        <button className="btn btn-secondary" onClick={fetchEnrollments}>Refresh Records</button>
      </div>

      <div className="arena-card mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
        <div className="form-group">
          <label className="form-label">Filter by Academic Class</label>
          <select className="form-input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            {classOptions.map((c) => <option key={c} value={c}>{c === "ALL" ? "All Active Classes" : c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Enrollment Status</label>
          <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "ALL" ? "All States" : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="arena-table-container">
        <table className="arena-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Target Class</th>
              <th>Billing Model</th>
              <th>Current Cycle</th>
              <th>Financial Status</th>
              <th>Joined Date</th>
              <th>State</th>
              {localStorage.getItem("role") === "ADMIN" && <th style={{ textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>Synchronizing enrollment records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No matching enrollments found.</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.enrollmentId}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{e.enrollmentId}</td>
                  <td style={{ fontWeight: 700 }}>{e.playerName}</td>
                  <td><div style={{ fontWeight: 600 }}>{e.className}</div></td>
                  <td>{billingLabel(e.billingType)}</td>
                  <td><div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary-dark)" }}>{e.currentPeriod}</div></td>
                  <td>
                    <span className={`status-pill ${e.currentFeeStatus === "PAID" ? "success" : e.currentFeeStatus === "OVERDUE" ? "danger" : "warning"}`}>
                      {feeStatusLabel(e.currentFeeStatus)}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{e.enrolledAt}</td>
                  <td>
                    <span className={`status-pill ${e.status === "ENROLLED" ? "success" : e.status === "CANCELLED" ? "danger" : "info"}`}>
                      {e.status}
                    </span>
                  </td>
                  {localStorage.getItem("role") === "ADMIN" && (
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {e.status === "ENROLLED" ? (
                          <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleCancel(e.enrollmentId, e.id)}>Cancel</button>
                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
