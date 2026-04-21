import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_OPTIONS = ["ALL", "ENROLLED", "CANCELLED"];

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

const CANCEL_REASONS = [
  "Payment Default / Outstanding Balance",
  "Violation of Academy Rules",
  "Student / Parent Request",
  "Administrative Decision"
];

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState(CANCEL_REASONS[0]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function openCancelModal(item) {
    setSelectedEnrollment(item);
    setCancellationReason(CANCEL_REASONS[0]);
    setIsCancelModalOpen(true);
  }

  async function handleConfirmCancel() {
    if (!selectedEnrollment) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${selectedEnrollment.id || selectedEnrollment.enrollmentId}/cancel`, { 
        method: "PATCH", 
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason })
      });
      if (res.ok) {
        setEnrollments(prev => prev.map(e => e.id === selectedEnrollment.id ? { ...e, status: "CANCELLED" } : e));
        setIsCancelModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.message || "Action failed");
      }
    } catch (err) { alert("Action failed"); }
    finally { setIsSubmitting(false); }
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
              <th>Financial Status</th>
              <th>Joined Date</th>
              <th>State</th>
              {localStorage.getItem("role") === "ADMIN" && <th style={{ textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>Synchronizing enrollment records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No matching enrollments found.</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.enrollmentId}>
                  <td><span className="table-id">{e.enrollmentId}</span></td>
                  <td style={{ fontWeight: 700 }}>{e.playerName}</td>
                  <td><div style={{ fontWeight: 600 }}>{e.className}</div></td>
                  <td>{billingLabel(e.billingType)}</td>
                  <td>
                    <span className={`status-pill ${e.currentFeeStatus === "PAID" ? "success" : e.currentFeeStatus === "OVERDUE" ? "danger" : "warning"}`}>
                      {feeStatusLabel(e.currentFeeStatus)}
                    </span>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>{e.currentPeriod}</div>
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
                          <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openCancelModal(e)}>Cancel</button>
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

      <CancelModal 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        reason={cancellationReason}
        setReason={setCancellationReason}
        isSubmitting={isSubmitting}
        studentName={selectedEnrollment?.playerName}
      />
    </div>
  );
}

// Minimalist Modal for Cancellation
function CancelModal({ isOpen, onClose, onConfirm, reason, setReason, isSubmitting, studentName }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <h3 className="modal-title">Cancel Enrollment</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Revoking access for <strong>{studentName}</strong>. This action will trigger an automated email notification to the student.
        </p>

        <div className="form-group">
          <label className="form-label">Reason for Cancellation</label>
          <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting}>
            {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="modal-actions" style={{ marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Keep Enrollment</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
