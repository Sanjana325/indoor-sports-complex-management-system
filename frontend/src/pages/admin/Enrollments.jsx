import { useMemo, useState } from "react";
import "../../styles/Enrollments.css";

const STATUS_OPTIONS = ["ALL", "ENROLLED", "CANCELLED"];

function statusLabel(s) {
  if (s === "ENROLLED") return "Enrolled";
  if (s === "CANCELLED") return "Cancelled";
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
  return "—";
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([
    {
      enrollmentId: "ENR-600001",
      playerName: "Kavindi Silva",
      className: "Beginner Cricket",
      billingType: "MONTHLY",
      currentPeriod: "2026-01",
      currentFeeStatus: "PAID",
      enrolledAt: "2026-01-18",
      status: "ENROLLED",
    },
    {
      enrollmentId: "ENR-600002",
      playerName: "Nuwan Perera",
      className: "Badminton Intermediate",
      billingType: "MONTHLY",
      currentPeriod: "2026-01",
      currentFeeStatus: "PENDING_VERIFICATION",
      enrolledAt: "2026-01-19",
      status: "ENROLLED",
    },
    {
      enrollmentId: "ENR-600003",
      playerName: "Saman Silva",
      className: "Karate Basics",
      billingType: "ONE_TIME",
      currentPeriod: "One-time",
      currentFeeStatus: "PAID",
      enrolledAt: "2026-01-19",
      status: "ENROLLED",
    },
    {
      enrollmentId: "ENR-600004",
      playerName: "Ishan Fernando",
      className: "Chess for Beginners",
      billingType: "ONE_TIME",
      currentPeriod: "One-time",
      currentFeeStatus: "PAID",
      enrolledAt: "2026-01-20",
      status: "CANCELLED",
    },
  ]);

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

  function handleCancel(enrollmentId) {
    const ok = window.confirm("Cancel this enrollment?");
    if (!ok) return;

    setEnrollments((prev) =>
      prev.map((e) => (e.enrollmentId === enrollmentId ? { ...e, status: "CANCELLED" } : e))
    );
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="enr-empty">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.enrollmentId}>
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
                      <button className="enr-remove-btn" type="button" onClick={() => handleCancel(e.enrollmentId)}>
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
