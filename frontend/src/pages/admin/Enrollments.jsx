import { useEffect, useMemo, useState } from "react";
import "../../styles/Enrollments.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_OPTIONS = ["ALL", "ENROLLED", "CANCELLED", "COMPLETED"];

function statusLabel(s) {
  if (s === "ENROLLED") return "Enrolled";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "COMPLETED") return "Completed";
  return s;
}

function billingLabel(t) {
  return t === "ONE_TIME" ? "One-time" : "Monthly";
}

function feeStatusLabel(s) {
  if (s === "PAID") return "Paid";
  if (s === "DUE") return "Due";
  if (s === "PENDING_VERIFICATION") return "Pending Verification";
  if (s === "OVERDUE") return "Overdue";
  return s;
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollments(data.enrollments || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(enrollments.map((e) => e.className)));
    unique.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...unique];
  }, [enrollments]);

  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const classOk = classFilter === "ALL" ? true : e.className === classFilter;
      const statusOk = statusFilter === "ALL" ? true : e.status === statusFilter;
      return classOk && statusOk;
    });
  }, [enrollments, classFilter, statusFilter]);

  async function handleCancel(enrollmentId, rawId) {
    const ok = window.confirm("Cancel this enrollment? This ensures the player loses access to the class without deleting their historical billing records.");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/enrollments/${rawId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEnrollments((prev) =>
          prev.map((e) => (e.id === rawId ? { ...e, status: "CANCELLED" } : e))
        );
      } else {
        const data = await res.json();
        alert(data.message || "Failed to cancel enrollment");
      }
    } catch (err) {
       alert("Error contacting the server");
    }
  }

  return (
    <div className="enr-page">
      <div className="enr-header">
        <h2 className="enr-title">Enrollments</h2>
      </div>

      <div className="enr-toolbar">
        <div className="enr-control">
          <label className="enr-label">Filter by Class</label>
          <select className="enr-filter" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Classes" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="enr-control">
          <label className="enr-label">Filter by Status</label>
          <select className="enr-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All" : statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="enr-table-wrap">
        <table className="enr-table">
          <thead>
            <tr>
              <th>Enrollment ID</th>
              <th>Player</th>
              <th>Class</th>
              <th>Billing</th>
              <th>Period</th>
              <th>Fee Status</th>
              <th>Enrolled At</th>
              <th>Status</th>
              <th className="enr-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
                <tr>
                 <td colSpan="9" className="enr-empty" style={{color: '#888'}}>
                   Loading enrollments...
                 </td>
               </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="enr-empty">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.enrollmentId}>
                  <td className="enr-mono">{e.enrollmentId}</td>
                  <td>{e.playerName}</td>
                  <td>{e.className}</td>
                  <td>{billingLabel(e.billingType)}</td>
                  <td className={e.currentPeriod === "—" ? "enr-dash" : "enr-mono"}>{e.currentPeriod}</td>
                  <td>{feeStatusLabel(e.currentFeeStatus)}</td>
                  <td className="enr-mono">{e.enrolledAt}</td>
                  <td>
                    <span className={`enr-badge ${e.status.toLowerCase()}`}>{statusLabel(e.status)}</span>
                  </td>
                  <td className="enr-center">
                    {e.status === "ENROLLED" ? (
                      <button className="enr-remove-btn" type="button" onClick={() => handleCancel(e.enrollmentId, e.id)}>
                        Cancel
                      </button>
                    ) : (
                      <span className="enr-dash">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
